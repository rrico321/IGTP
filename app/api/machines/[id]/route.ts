import type { NextRequest } from "next/server";
import { getMachineById, updateMachine } from "@/lib/db";
import { requireUserId } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const machine = await getMachineById(id);
  if (!machine) {
    return Response.json({ error: "Machine not found" }, { status: 404 });
  }
  return Response.json(machine);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const machine = await getMachineById(id);
  if (!machine) {
    return Response.json({ error: "Machine not found" }, { status: 404 });
  }

  if (machine.ownerId !== userId) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const allowed = ["name", "description", "gpuModel", "vramGb", "cpuModel", "ramGb", "status"];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  const updated = await updateMachine(id, updates);
  return Response.json(updated);
}
