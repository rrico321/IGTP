import { NextRequest } from "next/server";
import { requireUserId } from "@/lib/auth";
import { createInvite, getInvitesByInviter, getUserById } from "@/lib/db";
import { sendInviteEmail } from "@/lib/email";

// POST /api/invites — create a new invite
export async function POST(req: NextRequest) {
  let inviterId: string;
  try {
    inviterId = await requireUserId();
  } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { email } = await req.json().catch(() => ({}));
  if (!email || typeof email !== "string") {
    return Response.json({ error: "email is required" }, { status: 400 });
  }

  const [invite, inviter] = await Promise.all([
    createInvite(inviterId, email.toLowerCase().trim()),
    getUserById(inviterId),
  ]);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const inviteUrl = `${appUrl}/invite/${invite.token}`;

  // Fire-and-forget: email sending is best-effort
  sendInviteEmail({
    to: invite.inviteeEmail,
    inviterName: inviter?.name ?? "Someone",
    inviteUrl,
  }).catch(() => {});

  return Response.json({ invite, inviteUrl });
}

// GET /api/invites — list my sent invites
export async function GET() {
  let inviterId: string;
  try {
    inviterId = await requireUserId();
  } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const invites = await getInvitesByInviter(inviterId);
  return Response.json({ invites });
}
