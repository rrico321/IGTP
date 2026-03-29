import { getTrustConnections, getUsers } from '@/lib/db'
import { requireUserId } from '@/lib/auth'
import { removeTrustAction } from './actions'
import { AddTrustForm } from './AddTrustForm'
import type { User } from '@/lib/types'

export default async function TrustSettingsPage() {
  const userId = await requireUserId()
  const [allConnections, allUsers] = await Promise.all([
    getTrustConnections(),
    getUsers(),
  ])
  const connections = allConnections.filter((t) => t.userId === userId)
  const userMap = new Map<string, User>(allUsers.map((u) => [u.id, u]))

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Trust Network</h1>
        <p className="text-muted-foreground text-sm mt-1">
          People you trust can share machines with you on IGTP.
        </p>
      </div>

      {/* Add trusted user */}
      <div className="mb-8">
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-3">
          Add trusted user
        </h2>
        <AddTrustForm />
      </div>

      {/* Current trust network */}
      <div>
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-3">
          Trusted users ({connections.length})
        </h2>

        {connections.length === 0 && (
          <div className="text-center py-16 border border-border rounded-xl bg-card/30">
            <p className="text-muted-foreground text-sm">
              Your trust network is empty. Add users above to get started.
            </p>
          </div>
        )}

        {connections.length > 0 && (
          <div className="space-y-2">
            {connections.map((conn) => {
              const trusted = userMap.get(conn.trustedUserId)
              const removeAction = removeTrustAction.bind(null, conn.id)

              return (
                <div
                  key={conn.id}
                  className="flex items-center justify-between gap-4 bg-card border border-border rounded-xl px-5 py-4 ring-1 ring-foreground/5"
                >
                  <div>
                    <div className="font-medium text-sm text-foreground">
                      {trusted?.name ?? conn.trustedUserId}
                    </div>
                    {trusted?.email && (
                      <div className="text-xs text-muted-foreground">{trusted.email}</div>
                    )}
                  </div>
                  <form action={removeAction}>
                    <button
                      type="submit"
                      className="text-xs text-muted-foreground/50 hover:text-destructive transition-colors cursor-pointer"
                    >
                      Remove
                    </button>
                  </form>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
