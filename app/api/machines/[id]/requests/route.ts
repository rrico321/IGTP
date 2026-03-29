import type { NextRequest } from "next/server";
import { getMachineById, getRequestsByMachine, createRequest, getUserById, createNotification } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const machine = await getMachineById(id);
  if (!machine) {
    return Response.json({ error: "Machine not found" }, { status: 404 });
  }
  const requests = await getRequestsByMachine(id);
  return Response.json(requests);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const machine = await getMachineById(id);
  if (!machine) {
    return Response.json({ error: "Machine not found" }, { status: 404 });
  }

  const body = await request.json();
  const { requesterId, purpose, estimatedHours } = body;
  if (!requesterId || !purpose || !estimatedHours) {
    return Response.json(
      { error: "Missing required fields: requesterId, purpose, estimatedHours" },
      { status: 400 }
    );
  }

  const accessRequest = await createRequest({
    machineId: id,
    requesterId,
    purpose,
    estimatedHours: Number(estimatedHours),
  });

  // Notify the machine owner
  const requester = await getUserById(requesterId);
  createNotification({
    userId: machine.ownerId,
    type: "request_submitted",
    title: `New request — ${machine.name}`,
    message: `${requester?.name ?? "Someone"} wants to use ${machine.name} for ${estimatedHours}h: "${purpose}"`,
    requestId: accessRequest.id,
    linkUrl: `/machines/${id}/requests`,
  }).catch(() => {});

  return Response.json(accessRequest, { status: 201 });
}
