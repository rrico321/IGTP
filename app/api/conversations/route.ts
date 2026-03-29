import type { NextRequest } from "next/server";
import { requireUserId } from "@/lib/auth";
import { getConversationsByUser, createConversation, getRequestsByRequester } from "@/lib/db";

export async function GET() {
  const userId = await requireUserId();
  const conversations = await getConversationsByUser(userId);
  return Response.json(conversations);
}

export async function POST(request: NextRequest) {
  const userId = await requireUserId();
  const body = await request.json();
  const { machineId, model, title } = body;
  if (!machineId || !model) {
    return Response.json({ error: "machineId and model are required" }, { status: 400 });
  }

  // Verify user has approved access
  const requests = await getRequestsByRequester(userId);
  const approved = requests.find((r) => r.machineId === machineId && r.status === "approved");
  if (!approved) {
    return Response.json({ error: "No approved access to this machine" }, { status: 403 });
  }

  const conversation = await createConversation({
    userId,
    machineId,
    requestId: approved.id,
    model,
    title,
  });
  return Response.json(conversation, { status: 201 });
}
