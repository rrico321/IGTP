import type { NextRequest } from "next/server";
import { getJobById, updateJob } from "@/lib/db";
import { requireUserId, authenticateRequest } from "@/lib/auth";

// POST /api/jobs/cancel — bulk cancel multiple jobs
// Body: { "jobIds": ["id1", "id2", ...] }
export async function POST(request: NextRequest) {
  let userId: string | null = await authenticateRequest(request);
  if (!userId) {
    try {
      userId = await requireUserId();
    } catch {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const body = await request.json();
  const { jobIds } = body;
  if (!Array.isArray(jobIds) || jobIds.length === 0) {
    return Response.json({ error: "jobIds array is required" }, { status: 400 });
  }

  const results = await Promise.all(
    jobIds.map(async (jobId: string) => {
      const job = await getJobById(jobId);
      if (!job) return { jobId, cancelled: false, status: "not_found" };
      if (job.requesterId !== userId) return { jobId, cancelled: false, status: "not_yours" };

      if (job.status === "queued") {
        await updateJob(jobId, { status: "cancelled", completedAt: new Date().toISOString() });
        return { jobId, cancelled: true, status: "was_queued" };
      }
      if (job.status === "running") {
        await updateJob(jobId, { status: "cancelled", completedAt: new Date().toISOString() });
        return { jobId, cancelled: true, status: "was_running" };
      }

      return { jobId, cancelled: false, status: "already_" + job.status };
    })
  );

  const cancelledCount = results.filter((r) => r.cancelled).length;
  return Response.json({ results, cancelledCount, total: jobIds.length });
}
