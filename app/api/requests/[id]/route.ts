import type { NextRequest } from "next/server";
import { getRequestById, updateRequest } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const existing = getRequestById(id);
  if (!existing) {
    return Response.json({ error: "Request not found" }, { status: 404 });
  }

  const body = await request.json();
  const { status, ownerNote } = body;

  const validStatuses = ["pending", "approved", "denied", "completed", "cancelled"];
  if (status && !validStatuses.includes(status)) {
    return Response.json({ error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (status) updates.status = status;
  if (ownerNote !== undefined) updates.ownerNote = ownerNote;

  const updated = updateRequest(id, updates);
  return Response.json(updated);
}
