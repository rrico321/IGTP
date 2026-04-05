/**
 * igtp-daemon — GPU workload execution daemon
 *
 * Runs on each registered GPU machine. Polls the IGTP API for queued jobs,
 * executes them in an isolated container or bare process, streams logs to
 * Vercel Blob, posts usage snapshots every 30 s, and reports completion.
 *
 * Run `npx tsx setup.ts` first to generate your .env configuration.
 *
 * Environment variables required:
 *   IGTP_API_URL      — Base URL of the IGTP app (e.g. https://igtp.vercel.app)
 *   IGTP_MACHINE_ID   — ID of this machine in the IGTP database
 *   IGTP_API_KEY      — API key generated at Settings > API Keys on the website
 *
 * Optional:
 *   BLOB_READ_WRITE_TOKEN — Vercel Blob token for log uploads
 *   POLL_INTERVAL_MS      — How often to poll for new jobs (default 10 000)
 *   SNAPSHOT_INTERVAL_MS  — How often to post usage snapshots (default 30 000)
 *   HEARTBEAT_INTERVAL_MS — How often to send heartbeats (default 60 000)
 *
 * A1111 (optional):
 *   A1111_ENABLED         — "true" to enable A1111 session hosting
 *   A1111_URL             — URL of local A1111 instance (default http://localhost:7860)
 *   A1111_LAUNCH_CMD      — Command to start A1111 if not already running
 *   A1111_MAX_SESSIONS    — Max concurrent tunnel sessions (default 1)
 *   A1111_SESSION_MAX_MINS — Max session duration in minutes (default 120)
 */

import { spawn, execSync, type ChildProcess } from "child_process";
import { createWriteStream, writeFileSync } from "fs";
import { tmpdir, platform } from "os";
import { join } from "path";
import { createReadStream, existsSync } from "fs";
import { unlink, readFile } from "fs/promises";
import { startTunnel, stopTunnel, getActiveSessionCount, getActiveSessions, killOrphanedTunnels } from "./tunnel";

// ─── Structured logging ──────────────────────────────────────────────────────

function ts(): string {
  return new Date().toISOString().replace("T", " ").replace("Z", "");
}

function log(tag: string, msg: string, data?: Record<string, unknown>) {
  const extra = data ? " " + JSON.stringify(data) : "";
  console.log(`[${ts()}] [${tag}] ${msg}${extra}`);
}

function logErr(tag: string, msg: string, data?: Record<string, unknown>) {
  const extra = data ? " " + JSON.stringify(data) : "";
  console.error(`[${ts()}] [${tag}] ${msg}${extra}`);
}

// Job stats tracking
let jobsProcessed = 0;
let jobsFailed = 0;
let totalInferenceMs = 0;
let pollSkips = 0;

// Write PID file so tray and igtp.bat can detect/kill us
const pidPath = join(__dirname, "..", "daemon.pid");
writeFileSync(pidPath, String(process.pid));

// ─── Load .env if present ────────────────────────────────────────────────────

const envPath = join(__dirname, ".env");
if (existsSync(envPath)) {
  const envContent = require("fs").readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2];
    }
  }
}

// ─── Platform-aware shell ─────────────────────────────────────────────────────

const IS_WIN = platform() === "win32";
const SHELL = IS_WIN ? "cmd.exe" : "sh";
const SHELL_FLAG = IS_WIN ? "/c" : "-c";

// ─── Config ───────────────────────────────────────────────────────────────────

const API_URL = process.env.IGTP_API_URL ?? "http://localhost:3000";
const MACHINE_ID = process.env.IGTP_MACHINE_ID;
const API_KEY = process.env.IGTP_API_KEY;
const POLL_INTERVAL_MS = Number(process.env.POLL_INTERVAL_MS ?? 3_000);
const SNAPSHOT_INTERVAL_MS = Number(process.env.SNAPSHOT_INTERVAL_MS ?? 30_000);
const HEARTBEAT_INTERVAL_MS = Number(process.env.HEARTBEAT_INTERVAL_MS ?? 60_000);
const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://localhost:11434";

// vLLM config (OpenAI-compatible backend for specific models)
const VLLM_URL = process.env.VLLM_URL ?? "http://localhost:8100";
const VLLM_MODELS = new Set(
  (process.env.VLLM_MODELS ?? "").split(",").map(s => s.trim()).filter(Boolean)
);

// A1111 config
const A1111_ENABLED = process.env.A1111_ENABLED === "true";
const A1111_URL = (process.env.A1111_URL ?? "http://localhost:7860").replace(/\/+$/, "");
const A1111_LAUNCH_CMD = process.env.A1111_LAUNCH_CMD ?? "";
const A1111_MAX_SESSIONS = Number(process.env.A1111_MAX_SESSIONS ?? 1);
const A1111_SESSION_MAX_MINS = Number(process.env.A1111_SESSION_MAX_MINS ?? 120);

if (!MACHINE_ID) {
  console.error("[igtp-daemon] IGTP_MACHINE_ID is required — run `npx tsx setup.ts` first");
  process.exit(1);
}

if (!API_KEY) {
  console.error("[igtp-daemon] IGTP_API_KEY is required — run `npx tsx setup.ts` first");
  process.exit(1);
}

const HEADERS: Record<string, string> = {
  "Content-Type": "application/json",
  "Authorization": `Bearer ${API_KEY}`,
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface GpuJob {
  id: string;
  machineId: string;
  command: string;
  model: string | null;
  prompt: string | null;
  jobType: string;
  conversationId: string | null;
  dockerImage: string;
  maxRuntimeSec: number;
  vramLimitGb: number | null;
  cpuLimitCores: number | null;
  ramLimitGb: number | null;
  images: string | null;
}

// ─── API helpers ─────────────────────────────────────────────────────────────

async function apiPost(path: string, body: unknown) {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!text) return {};
  try { return JSON.parse(text); } catch { return { error: text }; }
}

async function apiGet(path: string) {
  const res = await fetch(`${API_URL}${path}`, { headers: HEADERS });
  const text = await res.text();
  if (!text) return {};
  try { return JSON.parse(text); } catch { return { error: text }; }
}

async function dispatchNext(): Promise<GpuJob | null> {
  try {
    const res = await fetch(`${API_URL}/api/jobs/dispatch`, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify({ machineId: MACHINE_ID }),
    });
    const text = await res.text();
    if (!text) return null;
    const data = JSON.parse(text);
    return data.dispatched ? (data.job as GpuJob) : null;
  } catch {
    return null;
  }
}

async function reportSnapshot(jobId: string, metrics: {
  gpuUtilPct?: number;
  vramUsedGb?: number;
  cpuUtilPct?: number;
  ramUsedGb?: number;
}) {
  await apiPost(`/api/jobs/${jobId}/snapshot`, metrics);
}

async function reportCompletion(
  jobId: string,
  status: string,
  exitCode: number | null,
  logUrl: string | null,
  outputText: string | null,
  tokens?: { promptTokens: number; completionTokens: number; totalTokens: number; tokensPerSec?: number | null } | null
) {
  log("report", `Job ${jobId} → ${status}`, {
    exitCode,
    outputLen: outputText?.length ?? 0,
    totalTokens: tokens?.totalTokens ?? 0,
    tokensPerSec: (tokens as any)?.tokensPerSec ?? null,
    hasLogUrl: !!logUrl,
  });
  await apiPost(`/api/jobs/${jobId}/snapshot`, {
    status, exitCode, outputLogUrl: logUrl, outputLog: outputText,
    ...(tokens ?? {}),
  });
}

// ─── Log upload ───────────────────────────────────────────────────────────────

async function uploadLog(logPath: string, jobId: string): Promise<string | null> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return null;

  try {
    const { put } = await import("@vercel/blob");
    const stream = createReadStream(logPath);
    const { url } = await put(`jobs/${jobId}/output.log`, stream, {
      access: "public",
      token,
    });
    return url;
  } catch (err) {
    console.error(`[igtp-daemon] Log upload failed for job ${jobId}:`, err);
    return null;
  }
}

// ─── Usage sampling ───────────────────────────────────────────────────────────

async function sampleUsage(): Promise<{ gpuUtilPct: number; vramUsedGb: number; cpuUtilPct: number; ramUsedGb: number }> {
  let gpuUtilPct = 0, vramUsedGb = 0;

  // Try nvidia-smi for GPU stats
  try {
    const nvCmd = IS_WIN ? "nvidia-smi" : "nvidia-smi";
    const result = execSync(
      `${nvCmd} --query-gpu=utilization.gpu,memory.used --format=csv,noheader,nounits`,
      { encoding: "utf-8", timeout: 5000 }
    ).trim();
    const [util, mem] = result.split(",").map((s) => parseFloat(s.trim()));
    if (!isNaN(util)) gpuUtilPct = util;
    if (!isNaN(mem)) vramUsedGb = Math.round(mem / 1024 * 100) / 100;
  } catch {}

  // CPU/RAM from Node.js
  const cpus = require("os").cpus();
  const cpuUtilPct = Math.round(
    cpus.reduce((sum: number, c: any) => {
      const total = Object.values(c.times as Record<string, number>).reduce((a, b) => a + b, 0);
      return sum + (1 - (c.times as any).idle / total) * 100;
    }, 0) / cpus.length
  );
  const totalMem = require("os").totalmem();
  const freeMem = require("os").freemem();
  const ramUsedGb = Math.round((totalMem - freeMem) / 1073741824 * 100) / 100;

  return { gpuUtilPct, vramUsedGb, cpuUtilPct, ramUsedGb };
}

// ─── Heartbeat ─────────────────────────────────────────────────────────────

async function sendHeartbeat(): Promise<void> {
  try {
    // Check actual A1111 availability
    const a1111Running = A1111_ENABLED ? await isA1111Running() : false;
    const a1111Available = a1111Running && getActiveSessionCount() < A1111_MAX_SESSIONS;

    // Clean up dead tunnel processes
    for (const session of getActiveSessions()) {
      if (session.process.killed || session.process.exitCode !== null) {
        console.log(`[tunnel] Cleaning up dead tunnel: ${session.sessionId}`);
        stopTunnel(session.sessionId);
        await apiPost(`/api/sessions/${session.sessionId}/tunnel`, {
          tunnelUrl: null, status: "ended", error: "Tunnel process died",
        }).catch(() => {});
      }
    }

    const activeTunnels = getActiveSessions().map((s) => ({
      sessionId: s.sessionId,
      tunnelUrl: s.tunnelUrl,
      expiresAt: s.expiresAt.toISOString(),
    }));

    const res = await fetch(`${API_URL}/api/machines/${MACHINE_ID}/heartbeat`, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify({
        a1111Enabled: A1111_ENABLED,
        a1111Available,
        activeTunnels,
      }),
    });
    if (!res.ok) {
      logErr("heartbeat", `Failed: ${res.status}`);
    } else {
      log("heartbeat", "OK", {
        a1111: A1111_ENABLED, a1111Available, tunnels: activeTunnels.length,
        jobsProcessed, jobsFailed, busy,
      });
    }
  } catch (err) {
    const msg = String(err);
    if (msg.includes("fetch failed") || msg.includes("TimeoutError") || msg.includes("ECONNREFUSED")) {
      logErr("heartbeat", "API unreachable");
    } else {
      logErr("heartbeat", `Error: ${err}`);
    }
  }
}

// ─── Model sync ──────────────────────────────────────────────────────────────

async function syncModels(): Promise<void> {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`);
    if (!res.ok) {
      console.error(`[igtp-daemon] Ollama not reachable: ${res.status}`);
      return;
    }
    const data = await res.json();
    const models = (data.models ?? []).map((m: { name: string; size: number }) => ({
      name: m.name,
      type: m.name.toLowerCase().includes("embed") ? "embedding" : "chat",
      sizeBytes: m.size,
    }));

    // Also include vLLM models
    if (VLLM_MODELS.size > 0) {
      try {
        const vllmRes = await fetch(`${VLLM_URL}/v1/models`);
        if (vllmRes.ok) {
          const vllmData = await vllmRes.json();
          for (const m of vllmData.data ?? []) {
            models.push({ name: m.id, type: "chat", sizeBytes: 0 });
          }
        }
      } catch {}
    }

    await apiPost(`/api/machines/${MACHINE_ID}/models`, { models });
    log("models", `Synced ${models.length} models`, { names: models.map((m: { name: string }) => m.name) });
  } catch (err) {
    const msg = String(err);
    if (msg.includes("fetch failed") || msg.includes("TimeoutError") || msg.includes("ECONNREFUSED")) {
      logErr("models", "Ollama unreachable");
    } else {
      logErr("models", `Sync error: ${err}`);
    }
  }
}

// ─── A1111 session management ────────────────────────────────────────────────

let a1111Process: ChildProcess | null = null;

async function isA1111Running(): Promise<boolean> {
  try {
    const res = await fetch(`${A1111_URL}/sdapi/v1/sd-models`, { signal: AbortSignal.timeout(5000) });
    return res.ok;
  } catch {
    return false;
  }
}

async function ensureA1111Running(): Promise<boolean> {
  if (await isA1111Running()) {
    console.log("[a1111] A1111 is already running");
    return true;
  }
  if (!A1111_LAUNCH_CMD) {
    console.log(`[a1111] A1111 not responding at ${A1111_URL}/sdapi/v1/sd-models and no launch command configured`);
    return false;
  }

  console.log(`[a1111] Starting: ${A1111_LAUNCH_CMD}`);
  a1111Process = spawn(SHELL, [SHELL_FLAG, A1111_LAUNCH_CMD], {
    stdio: ["ignore", "pipe", "pipe"],
    detached: !IS_WIN,
  });

  a1111Process.stdout?.on("data", (d: Buffer) => {
    const line = d.toString().trim();
    if (line) console.log(`[a1111:out] ${line}`);
  });
  a1111Process.stderr?.on("data", (d: Buffer) => {
    const line = d.toString().trim();
    if (line) console.log(`[a1111:err] ${line}`);
  });

  // Wait up to 120s for A1111 to become reachable
  console.log("[a1111] Waiting for A1111 to start (up to 120s)...");
  for (let i = 0; i < 24; i++) {
    await new Promise((r) => setTimeout(r, 5000));
    if (await isA1111Running()) {
      console.log("[a1111] A1111 is ready");
      return true;
    }
  }

  console.error("[a1111] A1111 did not start within 120s");
  return false;
}

async function handleA1111SessionRequest(sessionId: string): Promise<{ tunnelUrl: string } | { error: string }> {
  if (!A1111_ENABLED) {
    return { error: "A1111 hosting is not enabled on this machine" };
  }

  if (getActiveSessionCount() >= A1111_MAX_SESSIONS) {
    return { error: "Maximum concurrent sessions reached" };
  }

  // Ensure A1111 is running
  const running = await ensureA1111Running();
  if (!running) {
    return { error: "A1111 is not running and could not be started" };
  }

  // Start tunnel
  try {
    const session = await startTunnel(sessionId, A1111_URL, A1111_SESSION_MAX_MINS);
    if (!session.tunnelUrl) {
      return { error: "Failed to create tunnel" };
    }

    // Report session to API
    await apiPost(`/api/sessions/${sessionId}/tunnel`, {
      tunnelUrl: session.tunnelUrl,
      expiresAt: session.expiresAt.toISOString(),
    });

    return { tunnelUrl: session.tunnelUrl };
  } catch (err) {
    console.error(`[a1111] Failed to start session ${sessionId}:`, err);
    return { error: `Tunnel creation failed: ${err}` };
  }
}

async function handleA1111SessionStop(sessionId: string): Promise<void> {
  stopTunnel(sessionId);
  await apiPost(`/api/sessions/${sessionId}/tunnel`, {
    tunnelUrl: null,
    status: "ended",
  }).catch(() => {});
}

// ─── Session poll (checks for pending A1111 session requests) ────────────────

const inFlightSessions = new Set<string>();

async function pollSessions(): Promise<void> {
  if (!A1111_ENABLED) return;

  try {
    const data = await apiGet(`/api/machines/${MACHINE_ID}/sessions`);
    const pending = data.sessions?.filter((s: { status: string }) => s.status === "pending") ?? [];

    for (const session of pending) {
      if (inFlightSessions.has(session.id)) continue; // Already being processed
      inFlightSessions.add(session.id);
      console.log(`[a1111] Processing session request: ${session.id}`);
      const result = await handleA1111SessionRequest(session.id);
      inFlightSessions.delete(session.id);

      if ("error" in result) {
        console.error(`[a1111] Session ${session.id} failed: ${result.error}`);
        await apiPost(`/api/sessions/${session.id}/tunnel`, {
          tunnelUrl: null,
          status: "failed",
          error: result.error,
        }).catch(() => {});
      }
    }

    // Check for sessions that should be stopped
    const toStop = data.sessions?.filter((s: { status: string }) => s.status === "stop_requested") ?? [];
    for (const session of toStop) {
      console.log(`[a1111] Stopping session: ${session.id}`);
      await handleA1111SessionStop(session.id);
    }
  } catch (err) {
    // Suppress network errors and 404s silently — don't spam logs
    const msg = String(err);
    if (msg.includes("404") || msg.includes("fetch failed") || msg.includes("TimeoutError") || msg.includes("ECONNREFUSED")) return;
    console.error("[a1111] Session poll error:", err);
  }
}

// ─── Ollama execution ────────────────────────────────────────────────────────

async function executeOllamaJob(job: GpuJob): Promise<void> {
  log("ollama", `Starting job ${job.id}`, { type: job.jobType, model: job.model });

  const isEmbedding = job.jobType === "embedding";
  const endpoint = isEmbedding
    ? "/api/embed"
    : job.conversationId
    ? "/api/chat"
    : "/api/generate";

  // Parse images if present (stored as JSON array of base64 strings or data URIs)
  let imageArray: string[] | undefined;
  if (job.images) {
    try {
      const rawImages: string[] = JSON.parse(job.images);
      const processed: string[] = [];
      for (const raw of rawImages) {
        // Strip data URI prefix if present
        const match = raw.match(/^data:([^;]+);base64,([\s\S]+)$/);
        const mime = match ? match[1] : "image/png";
        const base64 = match ? match[2] : raw;

        // Convert PDFs to images
        if (mime === "application/pdf" || base64.startsWith("JVBERi")) {
          log("ollama", `Converting PDF to images for job ${job.id}`);
          try {
            const { pdf } = await import("pdf-to-img");
            const buffer = Buffer.from(base64, "base64");
            for await (const page of await pdf(buffer, { scale: 2 })) {
              processed.push(Buffer.from(page).toString("base64"));
            }
          } catch (err) {
            logErr("ollama", `PDF conversion failed for job ${job.id}: ${String(err)}`);
            await reportCompletion(job.id, "failed", 1, null, `PDF conversion failed: ${String(err)}`);
            return;
          }
        } else {
          processed.push(base64);
        }
      }
      imageArray = processed.length > 0 ? processed : undefined;
      if (imageArray) {
        log("ollama", `Job ${job.id} images ready`, { count: imageArray.length, totalSizeKB: Math.round(imageArray.reduce((s, i) => s + i.length * 0.75, 0) / 1024) });
      }
    } catch (outerErr) {
      logErr("ollama", `Image parsing failed for job ${job.id}: ${String(outerErr)}`);
      imageArray = undefined;
    }
  }

  let body: Record<string, unknown>;
  if (isEmbedding) {
    body = { model: job.model, input: job.prompt };
  } else if (job.conversationId) {
    let messages: Array<{ role: string; content: string; images?: string[] }>;
    try {
      messages = JSON.parse(job.command);
    } catch {
      messages = [{ role: "user", content: job.prompt ?? "" }];
    }
    // Attach images to the last user message if present
    if (imageArray && imageArray.length > 0) {
      const lastUserMsg = [...messages].reverse().find(m => m.role === "user");
      if (lastUserMsg) lastUserMsg.images = imageArray;
    }
    body = { model: job.model, messages, stream: false };
  } else {
    body = { model: job.model, prompt: job.prompt, stream: false };
    if (imageArray && imageArray.length > 0) {
      body.images = imageArray;
    }
  }

  try {
    const res = await fetch(`${OLLAMA_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      logErr("ollama", `Job ${job.id} API error`, { status: res.status, error: errText.slice(0, 200) });
      await reportCompletion(job.id, "failed", 1, null, `Ollama error: ${errText}`);
      return;
    }

    const data = await res.json();

    if (isEmbedding) {
      const outputText = JSON.stringify(data.embeddings ?? data.embedding);
      const tokens = {
        promptTokens: data.prompt_eval_count ?? 0,
        completionTokens: 0,
        totalTokens: data.prompt_eval_count ?? 0,
      };
      await reportCompletion(job.id, "completed", 0, null, outputText, tokens);
    } else {
      const outputText = job.conversationId
        ? (data.message?.content ?? "")
        : (data.response ?? "");
      // Ollama provides eval_duration in nanoseconds
      const evalCount = data.eval_count ?? 0;
      const evalDurationNs = data.eval_duration ?? 0;
      const tokensPerSec = evalDurationNs > 0
        ? Math.round((evalCount / (evalDurationNs / 1e9)) * 10) / 10
        : null;
      const tokens = {
        promptTokens: data.prompt_eval_count ?? 0,
        completionTokens: evalCount,
        totalTokens: (data.prompt_eval_count ?? 0) + evalCount,
        tokensPerSec,
      };
      await reportCompletion(job.id, "completed", 0, null, outputText, tokens);
    }

    log("ollama", `Job ${job.id} completed`, {
      model: job.model,
      promptTokens: data.prompt_eval_count ?? 0,
      completionTokens: evalCount,
      tokensPerSec,
      outputLen: (job.conversationId ? data.message?.content?.length : data.response?.length) ?? 0,
      totalDurationMs: data.total_duration ? Math.round(data.total_duration / 1e6) : null,
    });
  } catch (err) {
    jobsFailed++;
    logErr("ollama", `Job ${job.id} failed: ${err}`);
    await reportCompletion(job.id, "failed", 1, null, `Error: ${err}`).catch(() => {});
  }
}

// ─── vLLM execution (OpenAI-compatible) ──────────────────────────────────────

async function executeVllmJob(job: GpuJob): Promise<void> {
  console.log(`[igtp-daemon] vLLM job ${job.id}: ${job.model}`);

  // Parse images
  let images: string[] = [];
  if (job.images) {
    try {
      const rawImages: string[] = JSON.parse(job.images);
      for (const raw of rawImages) {
        const match = raw.match(/^data:([^;]+);base64,([\s\S]+)$/);
        const mime = match ? match[1] : "image/png";
        const base64 = match ? match[2] : raw;

        if (mime === "application/pdf" || base64.startsWith("JVBERi")) {
          console.log(`[igtp-daemon] Converting PDF to images for vLLM job ${job.id}`);
          try {
            const { pdf } = await import("pdf-to-img");
            const buffer = Buffer.from(base64, "base64");
            for await (const page of await pdf(buffer, { scale: 2 })) {
              images.push(`data:image/png;base64,${Buffer.from(page).toString("base64")}`);
            }
          } catch (err) {
            console.error(`[igtp-daemon] PDF conversion failed for job ${job.id}:`, String(err));
            await reportCompletion(job.id, "failed", 1, null, `PDF conversion failed: ${String(err)}`);
            return;
          }
        } else {
          images.push(`data:image/png;base64,${base64}`);
        }
      }
    } catch {}
  }

  // For chandra-ocr-2, use the OCR layout extraction prompt
  const isChandra = (job.model ?? "").includes("chandra-ocr");
  const chandraPrompt = "Convert the following page to HTML with data-bbox and data-label attributes for each block.";
  const promptText = isChandra ? chandraPrompt : (job.prompt ?? job.command);

  // Generation parameters — chandra-ocr-2 needs specific settings
  const genParams = isChandra
    ? { temperature: 0.0, top_p: 0.1, max_tokens: 12384 }
    : { max_tokens: 2048 };

  // For multi-page images, process one page at a time to stay within context limits
  const shouldProcessPerPage = isChandra && images.length > 1;

  try {
    if (shouldProcessPerPage) {
      console.log(`[igtp-daemon] Processing ${images.length} pages individually for job ${job.id}`);
      const allOutputs: string[] = [];
      let totalPromptTokens = 0;
      let totalCompletionTokens = 0;

      for (let i = 0; i < images.length; i++) {
        const pageNum = i + 1;
        console.log(`[igtp-daemon] vLLM job ${job.id}: page ${pageNum}/${images.length}`);
        const pageContent: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
          { type: "image_url", image_url: { url: images[i] } },
          { type: "text", text: promptText },
        ];
        const reqBody = JSON.stringify({ model: job.model, messages: [{ role: "user", content: pageContent }], ...genParams });

        let pageSuccess = false;
        for (let attempt = 1; attempt <= 2; attempt++) {
          const res = await fetch(`${VLLM_URL}/v1/chat/completions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: reqBody,
          });

          if (!res.ok) {
            const errText = await res.text();
            if (attempt === 1) {
              console.error(`[igtp-daemon] vLLM error for job ${job.id} page ${pageNum} (retrying): ${errText}`);
              continue;
            }
            console.error(`[igtp-daemon] vLLM error for job ${job.id} page ${pageNum} (failed after retry): ${errText}`);
            await reportCompletion(job.id, "failed", 1, null, `Page ${pageNum} failed after retry: ${errText}`);
            return;
          }

          const data = await res.json();
          const pageOutput = data.choices?.[0]?.message?.content ?? "";
          allOutputs.push(`<!-- Page ${pageNum} -->\n${pageOutput}`);
          totalPromptTokens += data.usage?.prompt_tokens ?? 0;
          totalCompletionTokens += data.usage?.completion_tokens ?? 0;
          pageSuccess = true;
          break;
        }

        if (!pageSuccess) {
          await reportCompletion(job.id, "failed", 1, null, `Page ${pageNum} failed after retry`);
          return;
        }
      }

      const combinedOutput = allOutputs.join("\n\n");
      await reportCompletion(job.id, "completed", 0, null, combinedOutput, {
        promptTokens: totalPromptTokens,
        completionTokens: totalCompletionTokens,
        totalTokens: totalPromptTokens + totalCompletionTokens,
      });
      console.log(`[igtp-daemon] vLLM job ${job.id} completed (${images.length} pages)`);
    } else {
      // Single image or non-chandra: send all at once
      const content: Array<{ type: string; text?: string; image_url?: { url: string } }> = [];
      for (const img of images) {
        content.push({ type: "image_url", image_url: { url: img } });
      }
      content.push({ type: "text", text: promptText });

      const res = await fetch(`${VLLM_URL}/v1/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: job.model, messages: [{ role: "user", content }], ...genParams }),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error(`[igtp-daemon] vLLM error for job ${job.id}: ${errText}`);
        await reportCompletion(job.id, "failed", 1, null, `vLLM error: ${errText}`);
        return;
      }

      const data = await res.json();
      const outputText = data.choices?.[0]?.message?.content ?? "";
      const usage = data.usage ?? {};
      await reportCompletion(job.id, "completed", 0, null, outputText, {
        promptTokens: usage.prompt_tokens ?? 0,
        completionTokens: usage.completion_tokens ?? 0,
        totalTokens: usage.total_tokens ?? 0,
      });
      console.log(`[igtp-daemon] vLLM job ${job.id} completed`);
    }
  } catch (err) {
    console.error(`[igtp-daemon] vLLM job ${job.id} failed:`, err);
    await reportCompletion(job.id, "failed", 1, null, `Error: ${err}`).catch(() => {});
  }
}

// ─── Job execution ────────────────────────────────────────────────────────────

async function executeJob(job: GpuJob): Promise<void> {
  console.log(`[igtp-daemon] Starting job ${job.id}: ${job.command}`);

  const logPath = join(tmpdir(), `igtp-job-${job.id}.log`);
  const logStream = createWriteStream(logPath);

  let cmd: string;
  let args: string[];

  if (job.dockerImage) {
    const dockerArgs = [
      "run", "--rm",
      "--network", "none",
      "--gpus", "all",
    ];
    if (job.ramLimitGb) dockerArgs.push(`--memory=${job.ramLimitGb}g`);
    if (job.cpuLimitCores) dockerArgs.push(`--cpus=${job.cpuLimitCores}`);
    dockerArgs.push(job.dockerImage, "sh", "-c", job.command);
    cmd = "docker";
    args = dockerArgs;
  } else {
    cmd = SHELL;
    args = [SHELL_FLAG, job.command];
  }

  const child = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"] });

  child.stdout.pipe(logStream);
  child.stderr.pipe(logStream);

  const killTimer = setTimeout(() => {
    console.log(`[igtp-daemon] Job ${job.id} timed out — killing`);
    child.kill("SIGTERM");
    setTimeout(() => child.kill("SIGKILL"), 30_000);
  }, job.maxRuntimeSec * 1000);

  const snapshotTimer = setInterval(async () => {
    const metrics = await sampleUsage();
    await reportSnapshot(job.id, metrics).catch(() => {});
  }, SNAPSHOT_INTERVAL_MS);

  await new Promise<void>((resolve) => {
    child.on("close", async (code, signal) => {
      clearTimeout(killTimer);
      clearInterval(snapshotTimer);
      logStream.end();

      const timedOut = signal === "SIGKILL" || signal === "SIGTERM";
      const status = timedOut ? "timed_out" : code === 0 ? "completed" : "failed";

      console.log(`[igtp-daemon] Job ${job.id} ended — status=${status} exitCode=${code}`);

      const outputText = await readFile(logPath, "utf-8").catch(() => "");
      const logUrl = await uploadLog(logPath, job.id);
      await unlink(logPath).catch(() => {});

      await reportCompletion(job.id, status, code, logUrl, outputText || null).catch((err) => {
        console.error(`[igtp-daemon] Failed to report completion for ${job.id}:`, err);
      });

      resolve();
    });
  });
}

// ─── Poll loop ────────────────────────────────────────────────────────────────

let busy = false;

async function poll() {
  if (busy) {
    pollSkips++;
    return;
  }

  try {
    const job = await dispatchNext();
    if (!job) return;

    busy = true;
    const queuedAt = job.queuedAt ? new Date(job.queuedAt).getTime() : Date.now();
    const waitMs = Date.now() - queuedAt;
    const hasImages = !!job.images;
    const imageCount = hasImages ? (JSON.parse(job.images!).length ?? 0) : 0;

    log("dispatch", `Job ${job.id} claimed`, {
      model: job.model,
      type: job.jobType,
      queueWaitMs: waitMs,
      hasImages,
      imageCount,
      promptLen: job.prompt?.length ?? 0,
      pollSkipsSinceLast: pollSkips,
    });
    pollSkips = 0;

    const startTime = Date.now();

    if (job.model && VLLM_MODELS.has(job.model)) {
      await executeVllmJob(job);
    } else if (job.model) {
      await executeOllamaJob(job);
    } else {
      await executeJob(job);
    }

    const elapsedMs = Date.now() - startTime;
    totalInferenceMs += elapsedMs;
    jobsProcessed++;

    log("complete", `Job ${job.id} finished`, {
      elapsedMs,
      elapsedSec: Math.round(elapsedMs / 1000 * 10) / 10,
      model: job.model,
      totalJobsProcessed: jobsProcessed,
      totalJobsFailed: jobsFailed,
      avgInferenceMs: Math.round(totalInferenceMs / jobsProcessed),
    });
  } catch (err) {
    jobsFailed++;
    logErr("poll", `Poll error: ${err}`, { totalFailed: jobsFailed });
  } finally {
    busy = false;
  }
}

// ─── Startup ──────────────────────────────────────────────────────────────────

const DAEMON_VERSION = require("./package.json").version;
log("startup", `v${DAEMON_VERSION} starting`, {
  machine: MACHINE_ID,
  api: API_URL,
  pollMs: POLL_INTERVAL_MS,
  heartbeatMs: HEARTBEAT_INTERVAL_MS,
  ollama: OLLAMA_URL,
  pid: process.pid,
  nodeVersion: process.version,
  platform: platform(),
});
if (VLLM_MODELS.size > 0) {
  console.log(`[igtp-daemon]   vLLM: ${VLLM_URL} (models: ${[...VLLM_MODELS].join(", ")})`);
}
if (A1111_ENABLED) {
  console.log(`[igtp-daemon]   A1111: ${A1111_URL} (max ${A1111_MAX_SESSIONS} session(s), ${A1111_SESSION_MAX_MINS}min each)`);
} else {
  console.log(`[igtp-daemon]   A1111: disabled`);
}

// On startup, clean up any stale sessions from previous runs
async function cleanupStaleSessions() {
  if (!A1111_ENABLED) return;
  try {
    const data = await apiGet(`/api/machines/${MACHINE_ID}/sessions`);
    const stale = data.sessions?.filter((s: { status: string }) =>
      s.status === "pending" || s.status === "active"
    ) ?? [];
    for (const session of stale) {
      console.log(`[a1111] Cleaning up stale session from previous run: ${session.id}`);
      await apiPost(`/api/sessions/${session.id}/tunnel`, {
        tunnelUrl: null,
        status: "ended",
        error: "Daemon restarted",
      }).catch(() => {});
    }
    if (stale.length > 0) {
      console.log(`[a1111] Cleaned up ${stale.length} stale session(s)`);
    }
  } catch {}
}

// Safety net: prevent unhandled errors from crashing the daemon (before any async calls)
process.on("unhandledRejection", (err) => {
  console.error("[igtp-daemon] Unhandled rejection (non-fatal):", err);
});
process.on("uncaughtException", (err) => {
  console.error("[igtp-daemon] Uncaught exception (non-fatal):", err);
});

// Kill any orphaned cloudflared tunnels from a previous crash
killOrphanedTunnels();

// Immediate first sync
cleanupStaleSessions();
sendHeartbeat();
syncModels();
poll();
if (A1111_ENABLED) pollSessions();

// Recurring intervals
setInterval(poll, POLL_INTERVAL_MS);
setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);
setInterval(syncModels, HEARTBEAT_INTERVAL_MS);
if (A1111_ENABLED) setInterval(pollSessions, POLL_INTERVAL_MS);

// Graceful shutdown - stop all tunnels and notify API
async function shutdown() {
  console.log("\n[igtp-daemon] Shutting down...");
  // Remove PID file
  try { require("fs").unlinkSync(pidPath); } catch {}
  for (const session of getActiveSessions()) {
    await apiPost(`/api/sessions/${session.sessionId}/tunnel`, {
      tunnelUrl: null, status: "ended",
    }).catch(() => {});
    stopTunnel(session.sessionId);
  }
  if (a1111Process) {
    try { a1111Process.kill(); } catch {}
  }
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
// Windows: handle Ctrl+C in console
if (IS_WIN) {
  process.on("SIGHUP", shutdown);
}
