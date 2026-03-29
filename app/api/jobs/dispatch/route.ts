import type { NextRequest } from "next/server";
import { getNextQueuedJob, claimJobAsRunning, updateMachine } from "@/lib/db";

// Internal cron / daemon endpoint — dispatch the next queued job for a machine.
// Called by the igtp-daemon on each machine, or by the cron schedule.
// No user session required; protected by CRON_SECRET header.

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-cron-secret");
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { machineId } = body;
  if (!machineId) {
    return Response.json({ error: "machineId required" }, { status: 400 });
  }

  const nextJob = await getNextQueuedJob(machineId);
  if (!nextJob) {
    return Response.json({ dispatched: false, message: "No queued jobs" });
  }

  // Atomically claim the job as running
  const claimed = await claimJobAsRunning(nextJob.id);
  if (!claimed) {
    // Another daemon claimed it first
    return Response.json({ dispatched: false, message: "Job already claimed" });
  }

  // Mark machine as busy
  await updateMachine(machineId, { status: "busy" });

  return Response.json({ dispatched: true, job: claimed });
}

// Also support GET for daemon polling — returns next queued job without claiming it
export async function GET(request: NextRequest) {
  const secret = request.headers.get("x-cron-secret");
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const machineId = searchParams.get("machineId");
  if (!machineId) {
    return Response.json({ error: "machineId required" }, { status: 400 });
  }

  const nextJob = await getNextQueuedJob(machineId);
  return Response.json({ job: nextJob ?? null });
}
