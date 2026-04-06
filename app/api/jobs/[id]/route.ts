import type { NextRequest } from "next/server";
import { getJobById, getSnapshotsForJob, updateJob } from "@/lib/db";
import { requireUserId, authenticateRequest } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const job = await getJobById(id);
  if (!job) {
    return Response.json({ error: "Job not found" }, { status: 404 });
  }
  const snapshots = await getSnapshotsForJob(id);
  return Response.json({ ...job, snapshots });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const job = await getJobById(id);
  if (!job) {
    return Response.json({ error: "Job not found" }, { status: 404 });
  }

  const body = await request.json();

  // Requester can cancel their own job; priority update for any authorized user
  if (body.status === "cancelled") {
    if (job.requesterId !== userId) {
      return Response.json({ error: "Not your job" }, { status: 403 });
    }
    if (!["queued", "running"].includes(job.status)) {
      return Response.json({ error: "Job cannot be cancelled in its current state" }, { status: 400 });
    }
  }

  const updated = await updateJob(id, {
    ...(body.status === "cancelled" ? { status: "cancelled" as const, completedAt: new Date().toISOString() } : {}),
    ...(body.priority != null ? { priority: Number(body.priority) } : {}),
  });

  return Response.json(updated);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Support both cookie auth and API key auth
  let userId: string | null = await authenticateRequest(request);
  if (!userId) {
    try {
      userId = await requireUserId();
    } catch {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const { id } = await params;
  const job = await getJobById(id);
  if (!job) {
    return Response.json({ cancelled: false, status: "not_found" }, { status: 404 });
  }

  if (job.requesterId !== userId) {
    return Response.json({ error: "Not your job" }, { status: 403 });
  }

  if (job.status === "queued") {
    await updateJob(id, { status: "cancelled", completedAt: new Date().toISOString() });
    return Response.json({ cancelled: true, status: "was_queued" });
  }

  if (job.status === "running") {
    await updateJob(id, { status: "cancelled", completedAt: new Date().toISOString() });
    return Response.json({ cancelled: true, status: "was_running" });
  }

  // Already in terminal state
  return Response.json({ cancelled: false, status: "already_" + job.status });
}
