import type { NextRequest } from "next/server";
import { getMachineById, updateMachine } from "@/lib/db";

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
  const { id } = await params;
  const machine = await getMachineById(id);
  if (!machine) {
    return Response.json({ error: "Machine not found" }, { status: 404 });
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
