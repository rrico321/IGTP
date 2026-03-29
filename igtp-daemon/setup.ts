#!/usr/bin/env node
/**
 * igtp-daemon setup — interactive installer
 *
 * Walks the user through configuring their IGTP daemon:
 *   1. API URL + Machine ID + API Key
 *   2. Ollama configuration
 *   3. AUTOMATIC1111 (Stable Diffusion) hosting (optional)
 *   4. Writes config to .env file
 */

import * as readline from "readline";
import { writeFileSync, existsSync, readFileSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";

const ENV_PATH = join(__dirname, ".env");

function ask(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => rl.question(question, resolve));
}

async function main() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  console.log("");
  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║          IGTP Daemon — Setup Wizard              ║");
  console.log("╚══════════════════════════════════════════════════╝");
  console.log("");
  console.log("This will configure your machine to share GPU compute");
  console.log("with your trusted IGTP network.");
  console.log("");

  // ─── Load existing config if present ───────────────────────────────────────
  let existing: Record<string, string> = {};
  if (existsSync(ENV_PATH)) {
    const content = readFileSync(ENV_PATH, "utf-8");
    for (const line of content.split("\n")) {
      const match = line.match(/^([A-Z_]+)=(.*)$/);
      if (match) existing[match[1]] = match[2];
    }
    console.log("Found existing .env — current values shown as defaults.\n");
  }

  // ─── Step 1: Core settings ─────────────────────────────────────────────────
  console.log("── Step 1: Connection ──────────────────────────────");
  console.log("");

  const apiUrl = (await ask(rl, `  IGTP API URL [${existing.IGTP_API_URL ?? "https://igtp.vercel.app"}]: `)).trim()
    || existing.IGTP_API_URL || "https://igtp.vercel.app";

  const machineId = (await ask(rl, `  Machine ID (from your IGTP dashboard): `)).trim()
    || existing.IGTP_MACHINE_ID || "";

  if (!machineId) {
    console.error("\n  ✗ Machine ID is required. Register your machine at the IGTP website first.");
    rl.close();
    process.exit(1);
  }

  const apiKey = (await ask(rl, `  API Key (from Settings > API Keys): `)).trim()
    || existing.IGTP_API_KEY || "";

  if (!apiKey) {
    console.error("\n  ✗ API Key is required. Generate one at Settings > API Keys on the website.");
    rl.close();
    process.exit(1);
  }

  // ─── Step 2: Ollama ────────────────────────────────────────────────────────
  console.log("");
  console.log("── Step 2: Ollama (AI Text Models) ─────────────────");
  console.log("");
  console.log("  Ollama lets your machine run AI text models (chat,");
  console.log("  code generation, embeddings). It should already be");
  console.log("  running on this machine if you use it.");
  console.log("");

  const ollamaUrl = (await ask(rl, `  Ollama URL [${existing.OLLAMA_URL ?? "http://localhost:11434"}]: `)).trim()
    || existing.OLLAMA_URL || "http://localhost:11434";

  // ─── Step 3: AUTOMATIC1111 ─────────────────────────────────────────────────
  console.log("");
  console.log("── Step 3: Stable Diffusion (AUTOMATIC1111) ────────");
  console.log("");
  console.log("  AUTOMATIC1111 (also called A1111 or SD WebUI) is a");
  console.log("  popular web interface for generating AI images using");
  console.log("  Stable Diffusion models. It runs as a local web app");
  console.log("  and uses your GPU for fast image generation.");
  console.log("");
  console.log("  If you enable this, trusted friends in your IGTP");
  console.log("  network can request a session to use your A1111");
  console.log("  remotely — the daemon handles secure tunneling");
  console.log("  automatically. You control who has access.");
  console.log("");
  console.log("  Requirements:");
  console.log("    • AUTOMATIC1111 installed on this machine");
  console.log("    • A dedicated GPU (NVIDIA recommended, 6+ GB VRAM)");
  console.log("    • ~10 GB disk space for models");
  console.log("");
  console.log("  NOTE: Not all GPUs are suitable for image generation.");
  console.log("  If your GPU has less than 6 GB VRAM, you can skip");
  console.log("  this and still share your GPU for Ollama text models.");
  console.log("");

  const a1111Answer = (await ask(rl, "  Enable A1111 hosting? (y/N): ")).trim().toLowerCase();
  const enableA1111 = a1111Answer === "y" || a1111Answer === "yes";

  let a1111Url = "";
  let a1111LaunchCmd = "";
  let a1111MaxSessions = "1";
  let a1111SessionMaxMins = "120";

  if (enableA1111) {
    console.log("");
    console.log("  Great! A few more questions about your A1111 setup:");
    console.log("");

    a1111Url = (await ask(rl, `  A1111 URL [${existing.A1111_URL ?? "http://localhost:7860"}]: `)).trim()
      || existing.A1111_URL || "http://localhost:7860";

    console.log("");
    console.log("  If A1111 is NOT already running, the daemon can start");
    console.log("  it for you when a session is requested. Leave blank");
    console.log("  if A1111 is always running.");
    console.log("");
    console.log("  Example launch commands:");
    console.log("    Linux:   ./webui.sh --api --listen");
    console.log("    Windows: webui-user.bat --api --listen");
    console.log("    Conda:   conda run -n sd python launch.py --api --listen");
    console.log("");

    a1111LaunchCmd = (await ask(rl, "  A1111 launch command (or blank if always running): ")).trim()
      || existing.A1111_LAUNCH_CMD || "";

    a1111MaxSessions = (await ask(rl, `  Max concurrent sessions [${existing.A1111_MAX_SESSIONS ?? "1"}]: `)).trim()
      || existing.A1111_MAX_SESSIONS || "1";

    a1111SessionMaxMins = (await ask(rl, `  Max session duration in minutes [${existing.A1111_SESSION_MAX_MINS ?? "120"}]: `)).trim()
      || existing.A1111_SESSION_MAX_MINS || "120";

    // ─── Check for cloudflared ─────────────────────────────────────────────
    console.log("");
    console.log("  Checking for cloudflared (tunnel tool)...");

    let hasCloudflared = false;
    try {
      execSync("cloudflared --version", { stdio: "pipe" });
      hasCloudflared = true;
      console.log("  ✓ cloudflared is installed");
    } catch {
      console.log("  ✗ cloudflared not found");
      console.log("");
      console.log("  The daemon needs cloudflared to create secure tunnels.");
      console.log("  It will auto-download it on first use, or you can");
      console.log("  install it now:");
      console.log("");
      console.log("    macOS:   brew install cloudflared");
      console.log("    Linux:   curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o /usr/local/bin/cloudflared && chmod +x /usr/local/bin/cloudflared");
      console.log("    Windows: winget install Cloudflare.cloudflared");
      console.log("");
    }
  }

  // ─── Write .env ────────────────────────────────────────────────────────────
  const lines = [
    `# IGTP Daemon configuration — generated by setup`,
    `# ${new Date().toISOString()}`,
    ``,
    `IGTP_API_URL=${apiUrl}`,
    `IGTP_MACHINE_ID=${machineId}`,
    `IGTP_API_KEY=${apiKey}`,
    `OLLAMA_URL=${ollamaUrl}`,
    ``,
    `# AUTOMATIC1111 (Stable Diffusion)`,
    `A1111_ENABLED=${enableA1111}`,
  ];

  if (enableA1111) {
    lines.push(`A1111_URL=${a1111Url}`);
    if (a1111LaunchCmd) lines.push(`A1111_LAUNCH_CMD=${a1111LaunchCmd}`);
    lines.push(`A1111_MAX_SESSIONS=${a1111MaxSessions}`);
    lines.push(`A1111_SESSION_MAX_MINS=${a1111SessionMaxMins}`);
  }

  // Preserve optional keys from existing config
  if (existing.BLOB_READ_WRITE_TOKEN) {
    lines.push(``, `# Vercel Blob (log uploads)`);
    lines.push(`BLOB_READ_WRITE_TOKEN=${existing.BLOB_READ_WRITE_TOKEN}`);
  }

  lines.push("");
  writeFileSync(ENV_PATH, lines.join("\n"), "utf-8");

  console.log("");
  console.log("══════════════════════════════════════════════════");
  console.log("  ✓ Configuration saved to .env");
  console.log("");
  console.log("  To start the daemon:");
  console.log("    npm run dev     (development)");
  console.log("    npm start       (production)");
  console.log("");
  if (enableA1111) {
    console.log("  A1111 hosting is enabled. The daemon will:");
    console.log("    • Report A1111 availability in heartbeats");
    console.log("    • Create secure tunnels when sessions are requested");
    console.log("    • Auto-teardown tunnels when sessions expire");
    console.log("");
  }
  console.log("══════════════════════════════════════════════════");
  console.log("");

  rl.close();
}

main().catch((err) => {
  console.error("Setup failed:", err);
  process.exit(1);
});
