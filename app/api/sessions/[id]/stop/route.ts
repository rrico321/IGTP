import type { NextRequest } from "next/server";
import { requireUserId } from "@/lib/auth";
import { requestStopSession } from "@/lib/db";

// POST /api/sessions/[id]/stop — user or owner stops a session
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await requireUserId();
  const { id } = await params;

  const stopped = await requestStopSession(id, userId);
  if (!stopped) {
    return Response.json({ error: "Session not found or already ended" }, { status: 404 });
  }

  return Response.json({ ok: true });
}
