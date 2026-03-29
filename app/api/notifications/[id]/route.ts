import type { NextRequest } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { markNotificationRead } from "@/lib/db";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getCurrentUserId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const ok = await markNotificationRead(id, userId);
  if (!ok) return Response.json({ error: "Not found" }, { status: 404 });

  return Response.json({ ok: true });
}
