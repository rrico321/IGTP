import type { NextRequest } from "next/server";
import { getNextQueuedJob, claimJobAsRunning, updateMachine } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const userId = await authenticateRequest(request);
  const secret = request.headers.get("x-cron-secret");
  const hasLegacyAuth = process.env.CRON_SECRET && secret === process.env.CRON_SECRET;

  if (!userId && !hasLegacyAuth) {
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

  const claimed = await claimJobAsRunning(nextJob.id);
  if (!claimed) {
    return Response.json({ dispatched: false, message: "Job already claimed" });
  }

  await updateMachine(machineId, { status: "busy" });
  return Response.json({ dispatched: true, job: claimed });
}

export async function GET(request: NextRequest) {
  const userId = await authenticateRequest(request);
  const secret = request.headers.get("x-cron-secret");
  const hasLegacyAuth = process.env.CRON_SECRET && secret === process.env.CRON_SECRET;

  if (!userId && !hasLegacyAuth) {
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
