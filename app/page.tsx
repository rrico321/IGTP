import Link from 'next/link'
import { Suspense } from 'react'
import { getCurrentUserId } from '@/lib/auth'
import { getDashboardStats } from '@/lib/db'
import { TimeFilter } from './components/TimeFilter'
import {
  approveFriendRequestAction,
  denyFriendRequestAction,
  approveAccessRequestAction,
  denyAccessRequestAction,
} from './actions'
import {
  Users,
  Monitor,
  Cpu,
  MessageSquare,
  Zap,
  Clock,
  ImageIcon,
  TrendingUp,
  UserPlus,
  Shield,
  Check,
  X,
  ChevronRight,
} from 'lucide-react'

function getPeriodSince(period: string | undefined): string | undefined {
  const now = new Date()
  switch (period) {
    case 'week': {
      const d = new Date(now)
      d.setDate(d.getDate() - d.getDay())
      d.setHours(0, 0, 0, 0)
      return d.toISOString()
    }
    case 'month': {
      const d = new Date(now.getFullYear(), now.getMonth(), 1)
      return d.toISOString()
    }
    case 'year': {
      const d = new Date(now.getFullYear(), 0, 1)
      return d.toISOString()
    }
    default:
      return undefined
  }
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

function formatHours(h: number): string {
  if (h < 1) return `${Math.round(h * 60)}m`
  return `${h.toFixed(1)}h`
}

function formatMinutes(m: number): string {
  if (m >= 60) return `${(m / 60).toFixed(1)}h`
  return `${Math.round(m)}m`
}

// ─── Public landing ────────────────────────────────────────────────────────────

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
              title: 'Peer-to-peer compute',
              body: 'Borrow GPU time directly from friends. No cloud markup.',
            },
            {
              title: 'Trust-based access',
              body: 'Only people you explicitly trust can request your machines.',
            },
            {
              title: 'Invite-only network',
              body: 'Join via invite and instantly connect with your inviter\'s resources.',
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

// ─── KPI Card ──────────────────────────────────────────────────────────────────

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  pulse,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string | number
  sub?: string
  pulse?: boolean
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 ring-1 ring-foreground/5">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
          {label}
        </span>
        {pulse && (
          <span className="relative flex h-2 w-2 ml-auto">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-foreground font-mono">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  )
}

// ─── Dashboard ─────────────────────────────────────────────────────────────────

async function Dashboard({
  userId,
  period,
}: {
  userId: string
  period: string | undefined
}) {
  const since = getPeriodSince(period || 'month')
  const stats = await getDashboardStats(userId, since)

  const hasPending =
    stats.pendingFriendRequests.length > 0 ||
    stats.pendingAccessRequests.length > 0

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your IGTP network at a glance
          </p>
        </div>
        <Suspense>
          <TimeFilter />
        </Suspense>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard icon={Users} label="Network" value={stats.networkSize} sub="trusted connections" />
        <KpiCard
          icon={Monitor}
          label="Online"
          value={stats.machinesOnline}
          sub={`machine${stats.machinesOnline === 1 ? '' : 's'} live`}
          pulse={stats.machinesOnline > 0}
        />
        <KpiCard icon={Cpu} label="Models" value={stats.totalModelsAvailable} sub="available to you" />
        <KpiCard
          icon={Zap}
          label="Tokens Used"
          value={formatTokens(stats.tokensUsed)}
          sub={`${stats.jobsCompleted} jobs completed`}
        />
      </div>

      {/* Pending Actions */}
      {hasPending && (
        <div className="space-y-3">
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
            Needs Your Attention
          </h2>

          {stats.pendingFriendRequests.map((fr) => (
            <div
              key={fr.id}
              className="bg-card border border-border rounded-xl p-4 ring-1 ring-foreground/5 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                  <UserPlus className="h-4 w-4 text-blue-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {fr.fromUserName}
                  </p>
                  <p className="text-xs text-muted-foreground">wants to connect</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <form action={approveFriendRequestAction.bind(null, fr.id)}>
                  <button
                    type="submit"
                    className="h-8 w-8 flex items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-colors cursor-pointer"
                    title="Accept"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                </form>
                <form action={denyFriendRequestAction.bind(null, fr.id)}>
                  <button
                    type="submit"
                    className="h-8 w-8 flex items-center justify-center rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors cursor-pointer"
                    title="Deny"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </div>
          ))}

          {stats.pendingAccessRequests.map((ar) => (
            <div
              key={ar.id}
              className="bg-card border border-border rounded-xl p-4 ring-1 ring-foreground/5 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-8 w-8 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                  <Shield className="h-4 w-4 text-amber-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {ar.requesterName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    wants {ar.estimatedHours}h on <span className="text-foreground/80">{ar.machineName}</span>
                    {ar.purpose && <> — {ar.purpose}</>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <form action={approveAccessRequestAction.bind(null, ar.id)}>
                  <button
                    type="submit"
                    className="h-8 w-8 flex items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-colors cursor-pointer"
                    title="Approve"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                </form>
                <form action={denyAccessRequestAction.bind(null, ar.id)}>
                  <button
                    type="submit"
                    className="h-8 w-8 flex items-center justify-center rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors cursor-pointer"
                    title="Deny"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Two-column stats */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Left — Your Usage */}
        <div className="space-y-4">
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
            Your Usage
          </h2>

          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-card border border-border rounded-xl p-4 ring-1 ring-foreground/5">
              <div className="flex items-center gap-2 mb-1">
                <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Conversations</span>
              </div>
              <div className="text-xl font-bold font-mono text-foreground">{stats.conversationCount}</div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 ring-1 ring-foreground/5">
              <div className="flex items-center gap-2 mb-1">
                <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">A1111 Sessions</span>
              </div>
              <div className="text-xl font-bold font-mono text-foreground">{stats.a1111SessionCount}</div>
              {stats.a1111TotalMinutes > 0 && (
                <div className="text-xs text-muted-foreground mt-0.5">
                  {formatMinutes(stats.a1111TotalMinutes)} total
                </div>
              )}
            </div>
          </div>

          {/* Top models */}
          {stats.topModelsUsed.length > 0 && (
            <div className="bg-card border border-border rounded-xl ring-1 ring-foreground/5 overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Your Top Models
                </h3>
              </div>
              <div className="divide-y divide-border">
                {stats.topModelsUsed.map((m, i) => (
                  <div key={m.model} className="px-4 py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-xs text-muted-foreground font-mono w-4">{i + 1}</span>
                      <span className="text-sm text-foreground font-mono truncate">{m.model}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs text-muted-foreground">
                        {m.jobCount} jobs · {formatTokens(m.totalTokens)} tokens
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {stats.topModelsUsed.length === 0 && (
            <div className="bg-card/30 border border-border rounded-xl p-6 text-center">
              <p className="text-sm text-muted-foreground">No usage data yet</p>
              <Link href="/conversations" className="text-xs text-primary hover:opacity-80 mt-1 inline-block">
                Start a conversation →
              </Link>
            </div>
          )}
        </div>

        {/* Right — Your Machines or Network Highlights */}
        <div className="space-y-4">
          {stats.myMachineStats.length > 0 ? (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
                  Your Machines
                </h2>
                <Link href="/machines" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  Manage →
                </Link>
              </div>
              {stats.myMachineStats.map((m) => (
                <Link
                  key={m.machineId}
                  href={`/machines/${m.machineId}`}
                  className="block bg-card border border-border rounded-xl p-4 ring-1 ring-foreground/5 hover:border-border/60 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{m.machineName}</span>
                      <span className={`inline-flex items-center gap-1 text-xs ${m.online ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${m.online ? 'bg-emerald-500' : 'bg-muted-foreground/40'}`} />
                        {m.online ? 'Online' : 'Offline'}
                      </span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">Hours served</span>
                      <div className="text-foreground font-mono font-medium">{formatHours(m.totalHoursServed)}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Tokens</span>
                      <div className="text-foreground font-mono font-medium">{formatTokens(m.totalTokensProcessed)}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Connected</span>
                      <div className="text-foreground font-mono font-medium">{m.activeConnections}</div>
                    </div>
                  </div>
                  {m.topModel && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      Top model: <span className="text-foreground/80 font-mono">{m.topModel}</span>
                    </div>
                  )}
                </Link>
              ))}
            </>
          ) : (
            <>
              <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
                Your Machines
              </h2>
              <div className="bg-card/30 border border-border rounded-xl p-6 text-center">
                <p className="text-sm text-muted-foreground mb-1">No machines registered</p>
                <Link href="/machines" className="text-xs text-primary hover:opacity-80 inline-block">
                  Set up the daemon →
                </Link>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Network Highlights */}
      {(stats.popularMachines.length > 0 || stats.popularModels.length > 0) && (
        <div className="grid md:grid-cols-2 gap-6">
          {stats.popularMachines.length > 0 && (
            <div className="bg-card border border-border rounded-xl ring-1 ring-foreground/5 overflow-hidden">
              <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Popular Machines
                </h3>
              </div>
              <div className="divide-y divide-border">
                {stats.popularMachines.map((m) => (
                  <Link
                    key={m.machineId}
                    href={`/browse/${m.machineId}`}
                    className="px-4 py-2.5 flex items-center justify-between hover:bg-accent/30 transition-colors"
                  >
                    <span className="text-sm text-foreground">{m.machineName}</span>
                    <span className="text-xs text-muted-foreground">{m.jobCount} jobs</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {stats.popularModels.length > 0 && (
            <div className="bg-card border border-border rounded-xl ring-1 ring-foreground/5 overflow-hidden">
              <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                <Cpu className="h-3.5 w-3.5 text-muted-foreground" />
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Popular Models
                </h3>
              </div>
              <div className="divide-y divide-border">
                {stats.popularModels.map((m) => (
                  <div key={m.model} className="px-4 py-2.5 flex items-center justify-between">
                    <span className="text-sm text-foreground font-mono">{m.model}</span>
                    <span className="text-xs text-muted-foreground">{m.jobCount} jobs</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Start a Chat', href: '/conversations', icon: MessageSquare },
          { label: 'Browse Machines', href: '/browse', icon: Monitor },
          { label: 'Invite a Friend', href: '/settings/invites', icon: UserPlus },
          { label: 'View Jobs', href: '/settings', icon: Clock },
        ].map(({ label, href, icon: QIcon }) => (
          <Link
            key={href}
            href={href}
            className="bg-card border border-border rounded-xl p-3 text-center hover:border-border/60 hover:bg-card/80 transition-colors ring-1 ring-foreground/5"
          >
            <QIcon className="h-4 w-4 mx-auto mb-1.5 text-muted-foreground" />
            <span className="text-xs font-medium text-foreground">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const userId = await getCurrentUserId()
  if (!userId) return <LandingPage />

  const params = await searchParams
  const period = typeof params.period === 'string' ? params.period : undefined

  return <Dashboard userId={userId} period={period} />
}
