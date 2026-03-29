import type { NextRequest } from "next/server";
import { requireUserId } from "@/lib/auth";
import { deleteApiKey } from "@/lib/db";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await requireUserId();
  const { id } = await params;
  const deleted = await deleteApiKey(id, userId);
  if (!deleted) return Response.json({ error: "Key not found" }, { status: 404 });
  return Response.json({ ok: true });
}
