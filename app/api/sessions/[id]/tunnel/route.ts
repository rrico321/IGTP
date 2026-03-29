import type { NextRequest } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { updateSessionTunnel, getSessionById } from "@/lib/db";

// POST /api/sessions/[id]/tunnel — daemon reports tunnel URL or status change
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await authenticateRequest(request);
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  const { tunnelUrl, status, error, expiresAt } = body;

  // Map daemon status to session status
  let sessionStatus = status;
  if (tunnelUrl && !status) {
    sessionStatus = "active";
  }

  const session = await updateSessionTunnel(id, {
    tunnelUrl: tunnelUrl ?? undefined,
    status: sessionStatus ?? undefined,
    error: error ?? undefined,
    expiresAt: expiresAt ?? undefined,
  });

  if (!session) {
    return Response.json({ error: "Session not found" }, { status: 404 });
  }

  return Response.json(session);
}

// GET /api/sessions/[id]/tunnel — user checks session status
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSessionById(id);
  if (!session) {
    return Response.json({ error: "Session not found" }, { status: 404 });
  }
  return Response.json(session);
}
