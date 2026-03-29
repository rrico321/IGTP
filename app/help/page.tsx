import { requireUserId } from '@/lib/auth'
import { HelpView } from './HelpView'

export const metadata = {
  title: 'Help Center — IGTP',
  description: 'Everything you need to know about using IGTP',
}

export default async function HelpPage() {
  await requireUserId()
  return <HelpView />
}
