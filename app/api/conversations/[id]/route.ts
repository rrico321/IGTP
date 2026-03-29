import type { NextRequest } from "next/server";
import { requireUserId } from "@/lib/auth";
import { getConversationById, deleteConversation, updateConversationTitle } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await requireUserId();
  const { id } = await params;
  const conversation = await getConversationById(id);
  if (!conversation || conversation.userId !== userId) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  return Response.json(conversation);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await requireUserId();
  const { id } = await params;
  const conversation = await getConversationById(id);
  if (!conversation || conversation.userId !== userId) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  const body = await request.json();
  if (body.title) {
    await updateConversationTitle(id, body.title);
  }
  return Response.json({ ok: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await requireUserId();
  const { id } = await params;
  const deleted = await deleteConversation(id, userId);
  if (!deleted) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ ok: true });
}
