import Link from 'next/link'
import { requireUserId } from '@/lib/auth'
import { Key, FileText, GitPullRequest, Lock } from 'lucide-react'

const SETTINGS_LINKS = [
  { href: '/requests', label: 'My Requests', description: 'Access requests you\'ve sent to machine owners', icon: GitPullRequest },
  { href: '/jobs', label: 'Jobs', description: 'Audit log of all AI prompts and their results', icon: FileText },
  { href: '/settings/api-keys', label: 'API Keys', description: 'Manage API keys for daemon and programmatic access', icon: Key },
  { href: '/settings/password', label: 'Change Password', description: 'Update your account password', icon: Lock },
]

export default async function SettingsPage() {
  await requireUserId()

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your account, requests, and API access.
        </p>
      </div>

      <div className="space-y-3">
        {SETTINGS_LINKS.map(({ href, label, description, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-4 bg-card border border-border rounded-xl px-5 py-4 ring-1 ring-foreground/5 hover:ring-foreground/10 transition-all"
          >
            <Icon className="w-5 h-5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">{label}</p>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
