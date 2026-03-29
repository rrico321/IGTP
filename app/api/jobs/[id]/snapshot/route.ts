import type { NextRequest } from "next/server";
import { getJobById, createSnapshot, updateJob, updateMachine } from "@/lib/db";

// Called by igtp-daemon to post usage snapshots and report job completion.
// Protected by CRON_SECRET (same secret used by daemon).

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const secret = request.headers.get("x-cron-secret");
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const job = await getJobById(id);
  if (!job) {
    return Response.json({ error: "Job not found" }, { status: 404 });
  }

  const body = await request.json();

  // If the daemon is reporting a terminal status, close out the job
  const terminalStatuses = ["completed", "failed", "timed_out", "cancelled"] as const;
  type TerminalStatus = typeof terminalStatuses[number];
  if (body.status && terminalStatuses.includes(body.status as TerminalStatus)) {
    const updated = await updateJob(id, {
      status: body.status as TerminalStatus,
      exitCode: body.exitCode ?? null,
      outputLogUrl: body.outputLogUrl ?? null,
      completedAt: new Date().toISOString(),
    });

    // Free up the machine if no more jobs are queued
    await updateMachine(job.machineId, { status: "available" });

    return Response.json(updated);
  }

  // Otherwise it's a usage snapshot
  const snapshot = await createSnapshot({
    jobId: id,
    gpuUtilPct: body.gpuUtilPct ?? null,
    vramUsedGb: body.vramUsedGb ?? null,
    cpuUtilPct: body.cpuUtilPct ?? null,
    ramUsedGb: body.ramUsedGb ?? null,
  });

  return Response.json(snapshot, { status: 201 });
}
