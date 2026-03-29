import { requireUserId } from '@/lib/auth'
import { getNotificationsForUser, markAllNotificationsRead } from '@/lib/db'
import { NotificationsClient } from './NotificationsClient'

export default async function NotificationsPage() {
  const userId = await requireUserId()
  const notifications = await getNotificationsForUser(userId)

  // Mark all as read server-side on page load
  if (notifications.some((n) => !n.read)) {
    await markAllNotificationsRead(userId)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {notifications.length === 0
            ? 'No notifications yet.'
            : `${notifications.length} notification${notifications.length === 1 ? '' : 's'}`}
        </p>
      </div>

      <NotificationsClient notifications={notifications} />
    </div>
  )
}
