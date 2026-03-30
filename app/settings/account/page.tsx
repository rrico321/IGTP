import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getProfile } from './actions'
import AccountForm from './AccountForm'

export default async function AccountPage() {
  const { name, email } = await getProfile()

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <Link
        href="/settings"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Settings
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Account</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your profile and security settings.
        </p>
      </div>

      <AccountForm initialName={name} initialEmail={email} />
    </div>
  )
}
