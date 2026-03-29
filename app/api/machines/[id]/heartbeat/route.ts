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
  const machine = await updateMachineHeartbeat(id, userId);
  if (!machine) return Response.json({ error: "Machine not found or not owned by you" }, { status: 404 });

  return Response.json({ ok: true, lastHeartbeatAt: machine.lastHeartbeatAt });
}
