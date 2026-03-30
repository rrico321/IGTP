import type { NextRequest } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { getMachineById, getSessionsForMachine, updateSessionTunnel } from "@/lib/db";

// POST /api/machines/[id]/kick — owner kills all active sessions
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await authenticateRequest(request);
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const machine = await getMachineById(id);
  if (!machine || machine.ownerId !== userId) {
    return Response.json({ error: "Machine not found or not owned by you" }, { status: 404 });
  }

  const sessions = await getSessionsForMachine(id);
  let kicked = 0;
  for (const session of sessions) {
    if (session.status === "pending" || session.status === "active") {
      await updateSessionTunnel(session.id, { status: "ended", error: "Kicked by machine owner" });
      kicked++;
    }
  }

  return Response.json({ ok: true, kicked });
}
