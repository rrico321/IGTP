import type { NextRequest } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { getModelsForMachine, createJob, getRequestsByRequester } from "@/lib/db";

export async function POST(request: NextRequest) {
  const userId = await authenticateRequest(request);
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { machineId, model, prompt } = body;
  if (!machineId || !model || !prompt) {
    return Response.json({ error: "machineId, model, and prompt are required" }, { status: 400 });
  }

  // Verify user has approved, non-expired access to this machine
  const requests = await getRequestsByRequester(userId);
  const approved = requests.find((r) =>
    r.machineId === machineId && r.status === "approved" &&
    (!r.expiresAt || new Date(r.expiresAt) > new Date())
  );
  if (!approved) {
    return Response.json({ error: "No approved access to this machine (may have expired)" }, { status: 403 });
  }

  // Verify model exists on machine and is a chat model
  const models = await getModelsForMachine(machineId);
  const modelExists = models.some((m) => m.modelName === model && m.modelType === "chat");
  if (!modelExists) {
    return Response.json({ error: "Chat model not available on this machine" }, { status: 404 });
  }

  const job = await createJob({
    machineId,
    requesterId: userId,
    requestId: approved.id,
    command: prompt,
    model,
    prompt,
    jobType: "chat",
  });

  return Response.json({ jobId: job.id, status: "queued", model, machineId }, { status: 201 });
}
