"use server";

import { redirect } from "next/navigation";
import { requireUserId } from "@/lib/auth";
import { createInvite, getUserById } from "@/lib/db";
import { sendInviteEmail } from "@/lib/email";

export type InviteState = { error: string } | { ok: true; inviteUrl: string } | null;

export async function createInviteAction(
  _prevState: InviteState,
  formData: FormData
): Promise<InviteState> {
  const inviterId = await requireUserId();
  const email = (formData.get("email") as string)?.toLowerCase().trim();
  if (!email) return { error: "Email is required." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Please enter a valid email address." };
  }

  const invite = await createInvite(inviterId, email);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const inviteUrl = `${appUrl}/invite/${invite.token}`;

  const inviter = await getUserById(inviterId);
  sendInviteEmail({
    to: email,
    inviterName: inviter?.name ?? "Someone",
    inviteUrl,
  }).catch(() => {});

  return { ok: true, inviteUrl };
}
