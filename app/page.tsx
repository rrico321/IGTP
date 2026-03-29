import Link from 'next/link'
import { getMachines, getTrustedUserIds } from '@/lib/db'
import { getCurrentUserId } from '@/lib/auth'
import { MachineStatusBadge } from './components/StatusBadge'

// Public landing shown to unauthenticated visitors
function LandingPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="max-w-xl">
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          I Got The Power
        </h1>
        <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
          Share and access GPU compute with people you trust.
          No middlemen — just you and your network.
        </p>

        <div className="flex gap-3 mb-16">
          <Link
            href="/login"
            className="px-5 py-2.5 text-sm font-medium bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-colors"
          >
            Sign in
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              title: "Peer-to-peer compute",
              body: "Borrow GPU time directly from friends. No cloud markup.",
            },
            {
              title: "Trust-based access",
              body: "Only people you explicitly trust can request your machines.",
            },
            {
              title: "Invite-only network",
              body: "Join via invite and instantly connect with your inviter's resources.",
            },
          ].map(({ title, body }) => (
            <div
              key={title}
              className="bg-card border border-border rounded-xl p-4 ring-1 ring-foreground/5"
            >
              <div className="font-medium text-sm text-foreground mb-1">{title}</div>
              <div className="text-xs text-muted-foreground leading-relaxed">{body}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Authenticated home shown to signed-in users
async function AuthenticatedHome({ userId }: { userId: string }) {
  const [trustedIds, allMachines] = await Promise.all([
    getTrustedUserIds(userId),
    getMachines(),
  ])
  const trustedMachines = allMachines.filter(
    (m) => m.status === 'available' && trustedIds.includes(m.ownerId)
  )
  const featured = trustedMachines.slice(0, 3)

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-12">
        <h1 className="text-3xl font-bold tracking-tight mb-2">I Got The Power</h1>
        <p className="text-muted-foreground text-sm">
          Share and access GPU compute with people you trust.
        </p>
      </div>

      {featured.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
              Available from your network
            </h2>
            <Link href="/browse" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              View all {trustedMachines.length} →
            </Link>
          </div>
          <div className="space-y-2">
            {featured.map((machine) => (
              <Link
                key={machine.id}
                href={`/browse/${machine.id}`}
                className="block bg-card border border-border rounded-xl p-4 hover:border-border/60 hover:bg-card/80 transition-colors ring-1 ring-foreground/5"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                      <span className="font-medium text-sm text-foreground">{machine.name}</span>
                      <MachineStatusBadge status={machine.status} />
                    </div>
                    <div className="flex flex-wrap gap-x-4 text-xs text-muted-foreground">
                      <span>GPU: <span className="text-foreground/80">{machine.gpuModel}</span></span>
                      <span>VRAM: <span className="text-foreground/80">{machine.vramGb} GB</span></span>
                    </div>
                  </div>
                  <span className="text-muted-foreground/40 shrink-0 text-sm">→</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {trustedMachines.length === 0 && (
        <div className="text-center px-8 py-24 border border-border rounded-xl bg-card/30">
          <p className="text-muted-foreground mb-4">
            {trustedIds.length === 0
              ? 'Add trusted users to see their machines here.'
              : 'No machines available from your trust network right now.'}
          </p>
          <div className="flex justify-center gap-4 text-sm">
            {trustedIds.length === 0 && (
              <Link
                href="/settings/invites"
                className="text-foreground underline underline-offset-4 hover:text-foreground/80"
              >
                Invite someone →
              </Link>
            )}
            <Link
              href="/machines/new"
              className="text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              Register your machine →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

export default async function HomePage() {
  const userId = await getCurrentUserId()
  if (!userId) return <LandingPage />
  return <AuthenticatedHome userId={userId} />
}
