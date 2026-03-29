import type { NextRequest } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { getMachineById, syncMachineModels, getModelsForMachine } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const models = await getModelsForMachine(id);
  return Response.json(models);
}

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

  const body = await request.json();
  const models = body.models as Array<{ name: string; type: string; sizeBytes: number }>;
  if (!Array.isArray(models)) {
    return Response.json({ error: "models array required" }, { status: 400 });
  }

  await syncMachineModels(id, models);
  return Response.json({ ok: true, synced: models.length });
}
