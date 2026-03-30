import type { NextRequest } from "next/server";
import { requireUserId } from "@/lib/auth";
import {
  getConversationById, getMessagesForConversation,
  addConversationMessage, createJob, updateConversationTokens,
  updateConversationTitle, getRequestById,
} from "@/lib/db";

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
  const messages = await getMessagesForConversation(id);
  return Response.json(messages);
}

export async function POST(
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
  const { content } = body;
  if (!content?.trim()) {
    return Response.json({ error: "content is required" }, { status: 400 });
  }

  // Check access hasn't expired
  const accessRequest = await getRequestById(conversation.requestId);
  if (accessRequest?.expiresAt && new Date(accessRequest.expiresAt) <= new Date()) {
    return Response.json({ error: "Your access to this machine has expired. Submit a new request." }, { status: 403 });
  }

  // Get existing messages for context
  const existingMessages = await getMessagesForConversation(id);
  const history = existingMessages.map((m) => ({ role: m.role, content: m.content }));

  // Save user message
  await addConversationMessage({
    conversationId: id,
    role: "user",
    content: content.trim(),
  });

  // Auto-title on first message
  if (existingMessages.length === 0) {
    const autoTitle = content.trim().slice(0, 50) + (content.trim().length > 50 ? "..." : "");
    await updateConversationTitle(id, autoTitle);
  }

  // Create a job for this message (billing + daemon execution)
  const fullHistory = [...history, { role: "user", content: content.trim() }];

  const job = await createJob({
    machineId: conversation.machineId,
    requesterId: userId,
    requestId: conversation.requestId,
    command: JSON.stringify(fullHistory), // Full history for daemon
    model: conversation.model,
    prompt: content.trim(), // Just the user's message for display
    jobType: "chat",
    conversationId: id,
  });

  return Response.json({
    jobId: job.id,
    conversationId: id,
    history: [...history, { role: "user", content: content.trim() }],
  }, { status: 201 });
}
