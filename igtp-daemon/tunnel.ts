/**
 * tunnel.ts — Cloudflared tunnel manager for A1111 sessions
 *
 * Creates temporary Cloudflare Quick Tunnels to expose a local service
 * (A1111) to a trusted remote user. No Cloudflare account required.
 *
 * Each tunnel gets a random URL like: https://verb-noun-adjective.trycloudflare.com
 */

import { spawn, type ChildProcess } from "child_process";
import { platform, arch, tmpdir } from "os";
import { join } from "path";
import { existsSync, chmodSync, createWriteStream } from "fs";
import { mkdir } from "fs/promises";
import { pipeline } from "stream/promises";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TunnelSession {
  sessionId: string;
  tunnelUrl: string | null;
  process: ChildProcess;
  startedAt: Date;
  expiresAt: Date;
}

// ─── State ───────────────────────────────────────────────────────────────────

const activeSessions = new Map<string, TunnelSession>();

// ─── Cloudflared binary management ───────────────────────────────────────────

function getCloudflaredPath(): string {
  // Check if cloudflared is in PATH first
  try {
    const { execSync } = require("child_process");
    const result = execSync(platform() === "win32" ? "where cloudflared" : "which cloudflared", {
      stdio: "pipe",
      encoding: "utf-8",
    }).trim();
    if (result) return result.split("\n")[0];
  } catch {
    // Not in PATH, use local copy
  }

  const binDir = join(__dirname, ".bin");
  const ext = platform() === "win32" ? ".exe" : "";
  return join(binDir, `cloudflared${ext}`);
}

function getDownloadUrl(): string {
  const os = platform();
  const cpu = arch();

  if (os === "darwin") {
    return cpu === "arm64"
      ? "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-darwin-arm64.tgz"
      : "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-darwin-amd64.tgz";
  }
  if (os === "win32") {
    return "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe";
  }
  // Linux
  return cpu === "arm64"
    ? "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64"
    : "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64";
}

export async function ensureCloudflared(): Promise<string> {
  const cfPath = getCloudflaredPath();
  if (existsSync(cfPath)) return cfPath;

  console.log("[tunnel] cloudflared not found, downloading...");

  const binDir = join(__dirname, ".bin");
  await mkdir(binDir, { recursive: true });

  const url = getDownloadUrl();
  const isTgz = url.endsWith(".tgz");
  const isExe = url.endsWith(".exe");

  const res = await fetch(url);
  if (!res.ok || !res.body) {
    throw new Error(`Failed to download cloudflared: ${res.status}`);
  }

  if (isTgz) {
    // macOS: download .tgz and extract
    const tgzPath = join(tmpdir(), "cloudflared.tgz");
    const fileStream = createWriteStream(tgzPath);
    // @ts-ignore - ReadableStream to Node stream
    await pipeline(res.body as any, fileStream);
    const { execSync } = require("child_process");
    execSync(`tar -xzf "${tgzPath}" -C "${binDir}"`, { stdio: "pipe" });
  } else {
    // Linux/Windows: direct binary download
    const fileStream = createWriteStream(cfPath);
    // @ts-ignore
    await pipeline(res.body as any, fileStream);
  }

  if (!isExe) {
    chmodSync(cfPath, 0o755);
  }

  console.log(`[tunnel] cloudflared downloaded to ${cfPath}`);
  return cfPath;
}

// ─── Tunnel lifecycle ────────────────────────────────────────────────────────

export async function startTunnel(
  sessionId: string,
  localUrl: string,
  maxMins: number
): Promise<TunnelSession> {
  const cfPath = await ensureCloudflared();

  const now = new Date();
  const expiresAt = new Date(now.getTime() + maxMins * 60_000);

  const child = spawn(cfPath, ["tunnel", "--url", localUrl, "--no-autoupdate"], {
    stdio: ["ignore", "pipe", "pipe"],
  });

  const session: TunnelSession = {
    sessionId,
    tunnelUrl: null,
    process: child,
    startedAt: now,
    expiresAt,
  };

  activeSessions.set(sessionId, session);

  // Parse tunnel URL from cloudflared output
  const urlPromise = new Promise<string>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Tunnel URL not received within 30s")), 30_000);

    function parseLine(data: Buffer) {
      const line = data.toString();
      // cloudflared prints the URL to stderr like:
      // +----------------------------+
      // |  Your quick Tunnel has been created! Visit it at (it may take some time to be reachable):  |
      // |  https://verb-noun-adjective.trycloudflare.com                                             |
      // +----------------------------+
      const match = line.match(/(https:\/\/[a-z0-9-]+\.trycloudflare\.com)/);
      if (match) {
        clearTimeout(timeout);
        resolve(match[1]);
      }
    }

    child.stdout.on("data", parseLine);
    child.stderr.on("data", parseLine);

    child.on("error", (err) => {
      clearTimeout(timeout);
      reject(err);
    });

    child.on("close", (code) => {
      clearTimeout(timeout);
      if (!session.tunnelUrl) {
        reject(new Error(`cloudflared exited with code ${code} before providing URL`));
      }
    });
  });

  try {
    session.tunnelUrl = await urlPromise;
    console.log(`[tunnel] Session ${sessionId} started: ${session.tunnelUrl}`);
  } catch (err) {
    stopTunnel(sessionId);
    throw err;
  }

  // Auto-expire timer
  const remainingMs = expiresAt.getTime() - Date.now();
  setTimeout(() => {
    console.log(`[tunnel] Session ${sessionId} expired`);
    stopTunnel(sessionId);
  }, remainingMs);

  return session;
}

export function stopTunnel(sessionId: string): boolean {
  const session = activeSessions.get(sessionId);
  if (!session) return false;

  try {
    if (platform() === "win32") {
      // Windows: use taskkill to force-kill the process tree
      const pid = session.process.pid;
      if (pid) {
        try {
          require("child_process").execSync(`taskkill /F /T /PID ${pid}`, { stdio: "pipe" });
        } catch {}
      }
    } else {
      session.process.kill("SIGTERM");
      setTimeout(() => {
        try { session.process.kill("SIGKILL"); } catch {}
      }, 5_000);
    }
  } catch {}

  activeSessions.delete(sessionId);
  console.log(`[tunnel] Session ${sessionId} stopped`);
  return true;
}

export function getActiveSession(sessionId: string): TunnelSession | undefined {
  return activeSessions.get(sessionId);
}

export function getActiveSessions(): TunnelSession[] {
  return Array.from(activeSessions.values());
}

export function getActiveSessionCount(): number {
  return activeSessions.size;
}
