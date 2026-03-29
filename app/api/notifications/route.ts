import { getCurrentUserId } from "@/lib/auth";
import { getNotificationsForUser, markAllNotificationsRead } from "@/lib/db";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const notifications = await getNotificationsForUser(userId);
  return Response.json(notifications);
}

export async function DELETE() {
  const userId = await getCurrentUserId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  await markAllNotificationsRead(userId);
  return Response.json({ ok: true });
}
