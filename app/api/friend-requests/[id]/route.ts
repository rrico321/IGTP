import type { NextRequest } from "next/server";
import { requireUserId } from "@/lib/auth";
import { acceptFriendRequest, denyFriendRequest } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await requireUserId();
  const { id } = await params;
  const body = await request.json();
  const { action } = body;

  if (action === "accept") {
    const ok = await acceptFriendRequest(id, userId);
    if (!ok) return Response.json({ error: "Request not found or already handled" }, { status: 404 });
    return Response.json({ ok: true, action: "accepted" });
  }

  if (action === "deny") {
    const ok = await denyFriendRequest(id, userId);
    if (!ok) return Response.json({ error: "Request not found or already handled" }, { status: 404 });
    return Response.json({ ok: true, action: "denied" });
  }

  return Response.json({ error: "action must be 'accept' or 'deny'" }, { status: 400 });
}
