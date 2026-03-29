import type { NextRequest } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { updateMachineHeartbeat } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await authenticateRequest(request);
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Parse optional A1111 fields from body
  let a1111Enabled = false;
  let a1111Available = false;
  try {
    const body = await request.json();
    a1111Enabled = body.a1111Enabled === true;
    a1111Available = body.a1111Available === true;
  } catch {
    // No body or invalid JSON — that's fine, defaults to false
  }

  const machine = await updateMachineHeartbeat(id, userId, { a1111Enabled, a1111Available });
  if (!machine) return Response.json({ error: "Machine not found or not owned by you" }, { status: 404 });

  return Response.json({ ok: true, lastHeartbeatAt: machine.lastHeartbeatAt });
}
