import type { NextRequest } from "next/server";
import { authenticateRequest, requireUserId } from "@/lib/auth";
import {
  getSessionsForMachine,
  createA1111Session,
  getMachineById,
  isTrusted,
} from "@/lib/db";

// GET /api/machines/[id]/sessions — daemon polls for pending sessions
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await authenticateRequest(request);
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const sessions = await getSessionsForMachine(id);
  return Response.json({ sessions });
}

// POST /api/machines/[id]/sessions — user requests a new A1111 session
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let userId: string;
  // Support both cookie auth (website) and API key auth (daemon)
  const apiUser = await authenticateRequest(request);
  if (apiUser) {
    userId = apiUser;
  } else {
    try {
      userId = await requireUserId();
    } catch {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const { id } = await params;

  // Check machine exists and has A1111 enabled
  const machine = await getMachineById(id);
  if (!machine) {
    return Response.json({ error: "Machine not found" }, { status: 404 });
  }
  if (!machine.a1111Enabled) {
    return Response.json({ error: "This machine does not have A1111 enabled" }, { status: 400 });
  }
  if (!machine.a1111Available) {
    return Response.json({ error: "A1111 is currently at capacity on this machine" }, { status: 409 });
  }

  // Check trust — requester must be trusted by machine owner
  if (userId !== machine.ownerId) {
    const trusted = await isTrusted(machine.ownerId, userId);
    if (!trusted) {
      return Response.json({ error: "You must be in this machine owner's trust network" }, { status: 403 });
    }
  }

  const session = await createA1111Session(id, userId);
  return Response.json(session, { status: 201 });
}
