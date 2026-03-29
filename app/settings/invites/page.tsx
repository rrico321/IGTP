import { requireUserId } from "@/lib/auth";
import { getInvitesByInviter, getReferralsByInviter, getInviterOfUser } from "@/lib/db";
import { InviteForm } from "./InviteForm";

function statusLabel(status: string) {
  if (status === "accepted") return { label: "Accepted", cls: "text-green-500" };
  if (status === "expired") return { label: "Expired", cls: "text-muted-foreground/50" };
  return { label: "Pending", cls: "text-yellow-500" };
}

export default async function InvitesPage() {
  const userId = await requireUserId();
  const [invites, referrals, inviter] = await Promise.all([
    getInvitesByInviter(userId),
    getReferralsByInviter(userId),
    getInviterOfUser(userId),
  ]);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Invites</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Invite trusted friends to join your GPU network.
        </p>
      </div>

      {/* Send invite */}
      <div>
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-3">
          Invite someone
        </h2>
        <InviteForm />
        <p className="text-xs text-muted-foreground mt-2">
          They'll get an email with a link. When they accept, you'll both be added to each other's trust network.
        </p>
      </div>

      {/* Referrals */}
      {referrals.length > 0 && (
        <div>
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-3">
            People you've brought in ({referrals.length})
          </h2>
          <div className="space-y-2">
            {referrals.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between bg-card border border-border rounded-xl px-5 py-3 ring-1 ring-foreground/5"
              >
                <div>
                  <div className="font-medium text-sm text-foreground">{user.name}</div>
                  <div className="text-xs text-muted-foreground">{user.email}</div>
                </div>
                <span className="text-xs text-green-500">Member</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Who invited you */}
      {inviter && (
        <div className="bg-card border border-border rounded-xl px-5 py-4 ring-1 ring-foreground/5">
          <p className="text-xs text-muted-foreground">
            You were invited by <strong className="text-foreground">{inviter.name}</strong>.
          </p>
        </div>
      )}

      {/* Sent invites */}
      {invites.length > 0 && (
        <div>
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-3">
            Sent invites ({invites.length})
          </h2>
          <div className="space-y-2">
            {invites.map((invite) => {
              const { label, cls } = statusLabel(
                new Date(invite.expiresAt) < new Date() && invite.status === "pending"
                  ? "expired"
                  : invite.status
              );
              const inviteUrl = `${appUrl}/invite/${invite.token}`;

              return (
                <div
                  key={invite.id}
                  className="flex items-center justify-between gap-4 bg-card border border-border rounded-xl px-5 py-3 ring-1 ring-foreground/5"
                >
                  <div className="min-w-0">
                    <div className="text-sm text-foreground truncate">{invite.inviteeEmail}</div>
                    <div className="text-xs text-muted-foreground">
                      Sent {new Date(invite.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {invite.status === "pending" && new Date(invite.expiresAt) >= new Date() && (
                      <a
                        href={inviteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Copy link ↗
                      </a>
                    )}
                    <span className={`text-xs ${cls}`}>{label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {invites.length === 0 && referrals.length === 0 && (
        <div className="text-center py-12 border border-border rounded-xl bg-card/30">
          <p className="text-muted-foreground text-sm">
            No invites sent yet. Enter an email above to get started.
          </p>
        </div>
      )}
    </div>
  );
}
