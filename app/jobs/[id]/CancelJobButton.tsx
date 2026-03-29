'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function CancelJobButton({ jobId }: { jobId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleCancel() {
    if (!confirm('Cancel this job?')) return
    setLoading(true)
    try {
      await fetch(`/api/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleCancel}
      disabled={loading}
      className="text-xs px-2.5 py-1 rounded-md border border-red-500/30 text-red-400 hover:bg-red-500/10 disabled:opacity-50 transition-colors"
    >
      {loading ? 'Cancelling…' : 'Cancel'}
    </button>
  )
}
