import { redirect } from 'next/navigation'
import { getRequestsByRequester, getMachineById } from '@/lib/db'
import { requireUserId } from '@/lib/auth'
import { JobSubmitForm } from './JobSubmitForm'

export default async function NewJobPage({
  searchParams,
}: {
  searchParams: Promise<{ requestId?: string; machineId?: string }>
}) {
  const userId = await requireUserId()
  const { requestId: preselectedRequestId } = await searchParams

  // Only show approved requests that can accept jobs
  const requests = await getRequestsByRequester(userId)
  const approvedRequests = requests.filter((r) => r.status === 'approved')

  if (approvedRequests.length === 0) {
    redirect('/requests')
  }

  // Preload machine names for display
  const machineIds = [...new Set(approvedRequests.map((r) => r.machineId))]
  const machines = await Promise.all(machineIds.map((id) => getMachineById(id)))
  const machineMap = new Map(machines.filter(Boolean).map((m) => [m!.id, m!]))

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Submit GPU Job</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Run a command on an approved machine.
        </p>
      </div>

      <JobSubmitForm
        approvedRequests={approvedRequests}
        machineMap={Object.fromEntries(machineMap)}
        preselectedRequestId={preselectedRequestId}
      />
    </div>
  )
}
