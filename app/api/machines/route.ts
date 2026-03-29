import type { NextRequest } from "next/server";
import { getMachines, createMachine } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  let machines = await getMachines();

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
  const userId = await authenticateRequest(request);
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, description, gpuModel, vramGb, cpuModel, ramGb } = body;
  if (!name || !gpuModel || vramGb == null || !cpuModel || ramGb == null) {
    return Response.json(
      { error: "Missing required fields: name, gpuModel, vramGb, cpuModel, ramGb" },
      { status: 400 }
    );
  }

  const machine = await createMachine({
    name,
    description: description ?? "",
    gpuModel,
    vramGb: Number(vramGb),
    cpuModel,
    ramGb: Number(ramGb),
    status: "available",
    ownerId: userId,
    a1111Enabled: false,
    a1111Available: false,
  });

  return Response.json(machine, { status: 201 });
}
