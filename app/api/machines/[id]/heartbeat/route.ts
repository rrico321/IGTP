import type { NextRequest } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { updateMachineHeartbeat } from "@/lib/db";

// POST /api/machines/:id/heartbeat
// Called by the machine owner's client (or the machine itself) to signal it's online.
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getCurrentUserId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const machine = await updateMachineHeartbeat(id, userId);
  if (!machine) return Response.json({ error: "Machine not found or not owned by you" }, { status: 404 });

  return Response.json({ ok: true, lastHeartbeatAt: machine.lastHeartbeatAt });
}
