import type { NextRequest } from "next/server";
import { getJobs, createJob, getRequestById, getMachineById } from "@/lib/db";
import { requireUserId } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const jobs = await getJobs({
    machineId: searchParams.get("machineId") ?? undefined,
    requesterId: searchParams.get("requesterId") ?? undefined,
    status: searchParams.get("status") ?? undefined,
  });
  return Response.json(jobs);
}

export async function POST(request: NextRequest) {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const { requestId, command, dockerImage, priority, maxRuntimeSec, vramLimitGb, cpuLimitCores, ramLimitGb, model, prompt, jobType } = body;

  // If model and prompt are provided, use prompt as the command for backward compat
  const effectiveCommand = model && prompt ? prompt : command;

  if (!requestId || !effectiveCommand) {
    return Response.json({ error: "Missing required fields: requestId, command" }, { status: 400 });
  }

  // Validate the access request exists, belongs to this user, and is approved
  const accessRequest = await getRequestById(requestId);
  if (!accessRequest) {
    return Response.json({ error: "Access request not found" }, { status: 404 });
  }
  if (accessRequest.requesterId !== userId) {
    return Response.json({ error: "Not your access request" }, { status: 403 });
  }
  if (accessRequest.status !== "approved") {
    return Response.json({ error: "Access request is not approved" }, { status: 400 });
  }
  if (accessRequest.expiresAt && new Date(accessRequest.expiresAt) <= new Date()) {
    return Response.json({ error: "Your access to this machine has expired" }, { status: 403 });
  }

  const machine = await getMachineById(accessRequest.machineId);
  if (!machine) {
    return Response.json({ error: "Machine not found" }, { status: 404 });
  }

  const job = await createJob({
    machineId: accessRequest.machineId,
    requesterId: userId,
    requestId,
    command: effectiveCommand,
    dockerImage: dockerImage ?? "",
    priority: priority != null ? Number(priority) : 5,
    maxRuntimeSec: maxRuntimeSec != null ? Number(maxRuntimeSec) : 3600,
    vramLimitGb: vramLimitGb != null ? Number(vramLimitGb) : null,
    cpuLimitCores: cpuLimitCores != null ? Number(cpuLimitCores) : null,
    ramLimitGb: ramLimitGb != null ? Number(ramLimitGb) : null,
    model: model ?? undefined,
    prompt: prompt ?? undefined,
    jobType: jobType ?? undefined,
  });

  return Response.json(job, { status: 201 });
}
