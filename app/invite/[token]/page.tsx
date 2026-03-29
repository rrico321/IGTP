import { getInviteByToken, getUserById } from "@/lib/db";
import { notFound } from "next/navigation";
import { AcceptInviteForm } from "./AcceptInviteForm";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invite = await getInviteByToken(token);

  if (!invite) notFound();

  const isExpired =
    invite.status !== "pending" || new Date(invite.expiresAt) < new Date();

  const inviter = await getUserById(invite.inviterId);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight mb-1">IGTP</h1>
          <p className="text-muted-foreground text-sm">I Got The Power</p>
        </div>

        {isExpired ? (
          <div className="bg-card border border-border rounded-xl p-6 text-center">
            <p className="font-medium text-sm text-foreground mb-1">
              {invite.status === "accepted"
                ? "This invite has already been used."
                : "This invite has expired."}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Ask {inviter?.name ?? "your contact"} to send a new invite.
            </p>
          </div>
        ) : (
          <div>
            <div className="mb-6 text-center">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">{inviter?.name ?? "Someone"}</strong>{" "}
                invited you to join their GPU sharing network.
              </p>
            </div>
            <AcceptInviteForm
              token={token}
              inviteeEmail={invite.inviteeEmail}
            />
          </div>
        )}
      </div>
    </div>
  );
}
