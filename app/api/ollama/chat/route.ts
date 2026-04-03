import type { NextRequest } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { getModelsForMachine, createJob, getRequestsByRequester, getMachineById, getApprovedRequest, createRequest, updateRequest } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const userId = await authenticateRequest(request);
    if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { machineId, model, prompt } = body;
    if (!machineId || !model || !prompt) {
      return Response.json({ error: "machineId, model, and prompt are required" }, { status: 400 });
    }

    const machine = await getMachineById(machineId);
    if (!machine) {
      return Response.json({ error: "Machine not found" }, { status: 404 });
    }

    let requestId: string;
    const isOwner = machine.ownerId === userId;

    if (isOwner) {
      // Owners can always use their own machines - ensure an access request exists
      let existing = await getApprovedRequest(machineId, userId);
      if (!existing) {
        try {
          const req = await createRequest({
            machineId,
            requesterId: userId,
            purpose: "Owner access",
            estimatedHours: 8760,
            ownerNote: "",
          });
          await updateRequest(req.id, { status: "approved" });
          existing = (await getApprovedRequest(machineId, userId)) ?? undefined;
        } catch (err) {
          console.error("[chat] Failed to create owner access request:", err);
          return Response.json({ error: "Failed to initialize owner access" }, { status: 500 });
        }
      }
      if (!existing) {
        return Response.json({ error: "Failed to create owner access" }, { status: 500 });
      }
      requestId = existing.id;
    } else {
      const requests = await getRequestsByRequester(userId);
      const approved = requests.find((r) =>
        r.machineId === machineId && r.status === "approved" &&
        (!r.expiresAt || new Date(r.expiresAt) > new Date())
      );
      if (!approved) {
        return Response.json({ error: "No approved access to this machine (may have expired)" }, { status: 403 });
      }
      requestId = approved.id;
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
      requestId,
      command: prompt,
      model,
      prompt,
      jobType: "chat",
    });

    return Response.json({ jobId: job.id, status: "queued", model, machineId }, { status: 201 });
  } catch (err) {
    console.error("[chat] Unhandled error:", String(err), err instanceof Error ? err.stack : "");
    return Response.json({ error: `Internal server error: ${err instanceof Error ? err.message : String(err)}` }, { status: 500 });
  }
}
