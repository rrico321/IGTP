import type { NextRequest } from "next/server";
import { requireUserId } from "@/lib/auth";
import { createFriendRequest, getPendingFriendRequestsForUser, getUserById, createNotification } from "@/lib/db";

export async function GET() {
  const userId = await requireUserId();
  const requests = await getPendingFriendRequestsForUser(userId);
  return Response.json(requests);
}

export async function POST(request: NextRequest) {
  const userId = await requireUserId();
  const body = await request.json();
  const { toUserId } = body;
  if (!toUserId) return Response.json({ error: "toUserId required" }, { status: 400 });
  if (toUserId === userId) return Response.json({ error: "Cannot send request to yourself" }, { status: 400 });

  const friendReq = await createFriendRequest(userId, toUserId);

  // Notify the recipient
  const sender = await getUserById(userId);
  createNotification({
    userId: toUserId,
    type: "friend_request",
    title: "Friend request",
    message: `${sender?.name ?? "Someone"} wants to add you to their trust network.`,
    friendRequestId: friendReq.id,
  }).catch(() => {});

  return Response.json(friendReq, { status: 201 });
}
