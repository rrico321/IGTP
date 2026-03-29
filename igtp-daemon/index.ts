/**
 * igtp-daemon — GPU workload execution daemon
 *
 * Runs on each registered GPU machine. Polls the IGTP API for queued jobs,
 * executes them in an isolated container or bare process, streams logs to
 * Vercel Blob, posts usage snapshots every 30 s, and reports completion.
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
 */

import { spawn } from "child_process";
import { createWriteStream } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { createReadStream } from "fs";
import { unlink, readFile } from "fs/promises";

// ─── Config ───────────────────────────────────────────────────────────────────

const API_URL = process.env.IGTP_API_URL ?? "http://localhost:3000";
const MACHINE_ID = process.env.IGTP_MACHINE_ID;
const API_KEY = process.env.IGTP_API_KEY;
const POLL_INTERVAL_MS = Number(process.env.POLL_INTERVAL_MS ?? 10_000);
const SNAPSHOT_INTERVAL_MS = Number(process.env.SNAPSHOT_INTERVAL_MS ?? 30_000);
const HEARTBEAT_INTERVAL_MS = Number(process.env.HEARTBEAT_INTERVAL_MS ?? 60_000);
const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://localhost:11434";

if (!MACHINE_ID) {
  console.error("[igtp-daemon] IGTP_MACHINE_ID is required");
  process.exit(1);
}

if (!API_KEY) {
  console.error("[igtp-daemon] IGTP_API_KEY is required — generate one at your IGTP website under Settings > API Keys");
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
  dockerImage: string;
  maxRuntimeSec: number;
  vramLimitGb: number | null;
  cpuLimitCores: number | null;
  ramLimitGb: number | null;
}

// ─── API helpers ─────────────────────────────────────────────────────────────

async function apiPost(path: string, body: unknown) {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify(body),
  });
  return res.json();
}

async function dispatchNext(): Promise<GpuJob | null> {
  const data = await apiPost("/api/jobs/dispatch", { machineId: MACHINE_ID });
  return data.dispatched ? (data.job as GpuJob) : null;
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
  tokens?: { promptTokens: number; completionTokens: number; totalTokens: number } | null
) {
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

// ─── Usage sampling (stub — replace with nvidia-smi / /proc reads) ────────────

async function sampleUsage(): Promise<{ gpuUtilPct: number; vramUsedGb: number; cpuUtilPct: number; ramUsedGb: number }> {
  // TODO: replace with real sampling
  // GPU: run `nvidia-smi --query-gpu=utilization.gpu,memory.used --format=csv,noheader,nounits`
  // CPU/RAM: read /proc/stat and /proc/meminfo
  return {
    gpuUtilPct: 0,
    vramUsedGb: 0,
    cpuUtilPct: 0,
    ramUsedGb: 0,
  };
}

// ─── Heartbeat ─────────────────────────────────────────────────────────────

async function sendHeartbeat(): Promise<void> {
  try {
    const res = await fetch(`${API_URL}/api/machines/${MACHINE_ID}/heartbeat`, {
      method: "POST",
      headers: HEADERS,
    });
    if (!res.ok) {
      console.error(`[igtp-daemon] Heartbeat failed: ${res.status}`);
    }
  } catch (err) {
    console.error("[igtp-daemon] Heartbeat error:", err);
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

    await apiPost(`/api/machines/${MACHINE_ID}/models`, { models });
    console.log(`[igtp-daemon] Synced ${models.length} models`);
  } catch (err) {
    console.error("[igtp-daemon] Model sync error:", err);
  }
}

// ─── Ollama execution ────────────────────────────────────────────────────────

async function executeOllamaJob(job: GpuJob): Promise<void> {
  console.log(`[igtp-daemon] Ollama job ${job.id}: ${job.jobType} with ${job.model}`);

  const isEmbedding = job.jobType === "embedding";
  const endpoint = isEmbedding ? "/api/embed" : "/api/generate";
  const body = isEmbedding
    ? { model: job.model, input: job.prompt }
    : { model: job.model, prompt: job.prompt, stream: false };

  try {
    const res = await fetch(`${OLLAMA_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[igtp-daemon] Ollama error for job ${job.id}: ${errText}`);
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
      const outputText = data.response ?? "";
      const tokens = {
        promptTokens: data.prompt_eval_count ?? 0,
        completionTokens: data.eval_count ?? 0,
        totalTokens: (data.prompt_eval_count ?? 0) + (data.eval_count ?? 0),
      };
      await reportCompletion(job.id, "completed", 0, null, outputText, tokens);
    }

    console.log(`[igtp-daemon] Ollama job ${job.id} completed`);
  } catch (err) {
    console.error(`[igtp-daemon] Ollama job ${job.id} failed:`, err);
    await reportCompletion(job.id, "failed", 1, null, `Error: ${err}`).catch(() => {});
  }
}

// ─── Job execution ────────────────────────────────────────────────────────────

async function executeJob(job: GpuJob): Promise<void> {
  console.log(`[igtp-daemon] Starting job ${job.id}: ${job.command}`);

  const logPath = join(tmpdir(), `igtp-job-${job.id}.log`);
  const logStream = createWriteStream(logPath);

  // Build the execution command
  let cmd: string;
  let args: string[];

  if (job.dockerImage) {
    // Tier 1: Docker container
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
    // Tier 2: Bare process via systemd-run (or direct shell as fallback)
    cmd = "sh";
    args = ["-c", job.command];
  }

  const child = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"] });

  child.stdout.pipe(logStream);
  child.stderr.pipe(logStream);

  // Watchdog: kill after max_runtime_sec
  const killTimer = setTimeout(() => {
    console.log(`[igtp-daemon] Job ${job.id} timed out — killing`);
    child.kill("SIGTERM");
    setTimeout(() => child.kill("SIGKILL"), 30_000);
  }, job.maxRuntimeSec * 1000);

  // Usage snapshot loop
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

      // Read output before uploading/deleting
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
  if (busy) return;

  try {
    const job = await dispatchNext();
    if (!job) return;

    busy = true;
    if (job.model) {
      await executeOllamaJob(job);
    } else {
      await executeJob(job);
    }
  } catch (err) {
    console.error("[igtp-daemon] Poll error:", err);
  } finally {
    busy = false;
  }
}

console.log(`[igtp-daemon] Starting on machine ${MACHINE_ID}`);
console.log(`[igtp-daemon]   API: ${API_URL}`);
console.log(`[igtp-daemon]   Poll interval: ${POLL_INTERVAL_MS}ms`);
console.log(`[igtp-daemon]   Heartbeat interval: ${HEARTBEAT_INTERVAL_MS}ms`);
console.log(`[igtp-daemon]   Ollama: ${OLLAMA_URL}`);

// Immediate first sync
sendHeartbeat();
syncModels();
poll();

// Recurring intervals
setInterval(poll, POLL_INTERVAL_MS);
setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);
setInterval(syncModels, HEARTBEAT_INTERVAL_MS);
