import type { NextRequest } from "next/server";
import { getJobById, createSnapshot, updateJob, updateMachine, addConversationMessage, updateConversationTokens } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await authenticateRequest(request);
  const secret = request.headers.get("x-cron-secret");
  const hasLegacyAuth = process.env.CRON_SECRET && secret === process.env.CRON_SECRET;

  if (!userId && !hasLegacyAuth) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const job = await getJobById(id);
  if (!job) {
    return Response.json({ error: "Job not found" }, { status: 404 });
  }

  const body = await request.json();

  const terminalStatuses = ["completed", "failed", "timed_out", "cancelled"] as const;
  type TerminalStatus = typeof terminalStatuses[number];
  if (body.status && terminalStatuses.includes(body.status as TerminalStatus)) {
    const updated = await updateJob(id, {
      status: body.status as TerminalStatus,
      exitCode: body.exitCode ?? null,
      outputLogUrl: body.outputLogUrl ?? null,
      outputLog: body.outputLog ?? null,
      promptTokens: body.promptTokens ?? null,
      completionTokens: body.completionTokens ?? null,
      totalTokens: body.totalTokens ?? null,
      completedAt: new Date().toISOString(),
    });

    await updateMachine(job.machineId, { status: "available" });

    // If this is a conversation job, save the assistant message
    if (updated?.conversationId && body.status === "completed" && body.outputLog) {
      const totalTokens = body.totalTokens ?? 0;
      await addConversationMessage({
        conversationId: updated.conversationId,
        role: "assistant",
        content: body.outputLog,
        jobId: id,
        tokens: totalTokens,
        tokensPerSec: body.tokensPerSec ?? undefined,
      }).catch(() => {});

      await updateConversationTokens(updated.conversationId, totalTokens).catch(() => {});
    }

    return Response.json(updated);
  }

  const snapshot = await createSnapshot({
    jobId: id,
    gpuUtilPct: body.gpuUtilPct ?? null,
    vramUsedGb: body.vramUsedGb ?? null,
    cpuUtilPct: body.cpuUtilPct ?? null,
    ramUsedGb: body.ramUsedGb ?? null,
  });

  return Response.json(snapshot, { status: 201 });
}
