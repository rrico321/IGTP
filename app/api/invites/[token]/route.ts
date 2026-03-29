import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import {
  getInviteByToken,
  acceptInvite,
  createUserWithEmail,
  getUserByEmail,
  addTrustConnection,
} from "@/lib/db";
import { SESSION_COOKIE } from "@/lib/auth";

// GET /api/invites/[token] — validate invite token
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const invite = await getInviteByToken(token);
  if (!invite) {
    return Response.json({ error: "Invite not found" }, { status: 404 });
  }
  if (invite.status !== "pending" || new Date(invite.expiresAt) < new Date()) {
    return Response.json({ error: "Invite expired or already used" }, { status: 410 });
  }
  return Response.json({
    inviteeEmail: invite.inviteeEmail,
    status: invite.status,
    expiresAt: invite.expiresAt,
  });
}

// POST /api/invites/[token]/accept — accept invite, create account, set session
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const invite = await getInviteByToken(token);

  if (!invite) {
    return Response.json({ error: "Invite not found" }, { status: 404 });
  }
  if (invite.status !== "pending" || new Date(invite.expiresAt) < new Date()) {
    return Response.json({ error: "Invite expired or already used" }, { status: 410 });
  }

  const { name } = await req.json().catch(() => ({}));
  if (!name || typeof name !== "string" || !name.trim()) {
    return Response.json({ error: "name is required" }, { status: 400 });
  }

  // Use existing account if the email is already registered, otherwise create new
  let user = await getUserByEmail(invite.inviteeEmail);
  if (!user) {
    user = await createUserWithEmail(name.trim(), invite.inviteeEmail);
  }

  // Mark invite as accepted
  await acceptInvite(token, user.id);

  // Add mutual trust between inviter and new user
  await Promise.all([
    addTrustConnection(invite.inviterId, user.id),
    addTrustConnection(user.id, invite.inviterId),
  ]);

  // Set session cookie
  const store = await cookies();
  store.set(SESSION_COOKIE, user.id, {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    sameSite: "lax",
  });

  return Response.json({ ok: true, userId: user.id });
}
