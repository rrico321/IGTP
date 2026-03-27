import type { NextRequest } from "next/server";
import { getMachines, createMachine } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  let machines = getMachines();

  const status = searchParams.get("status");
  if (status) {
    machines = machines.filter((m) => m.status === status);
  }

  const gpuModel = searchParams.get("gpuModel");
  if (gpuModel) {
    machines = machines.filter((m) =>
      m.gpuModel.toLowerCase().includes(gpuModel.toLowerCase())
    );
  }

  return Response.json(machines);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const { name, description, gpuModel, vramGb, cpuModel, ramGb, ownerId } = body;
  if (!name || !gpuModel || !vramGb || !cpuModel || !ramGb || !ownerId) {
    return Response.json(
      { error: "Missing required fields: name, gpuModel, vramGb, cpuModel, ramGb, ownerId" },
      { status: 400 }
    );
  }

  const machine = createMachine({
    name,
    description: description ?? "",
    gpuModel,
    vramGb: Number(vramGb),
    cpuModel,
    ramGb: Number(ramGb),
    status: "available",
    ownerId,
  });

  return Response.json(machine, { status: 201 });
}
