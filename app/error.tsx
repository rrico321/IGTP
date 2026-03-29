'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center">
        <div className="text-4xl mb-4">⚠</div>
        <h2 className="text-lg font-semibold text-foreground mb-2">
          Something went wrong
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          {error.message || 'An unexpected error occurred.'}
        </p>
        <div className="flex justify-center gap-3">
          <button
            onClick={reset}
            className="text-sm px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            Try again
          </button>
          <Link
            href="/"
            className="text-sm px-4 py-2 border border-border rounded-lg text-muted-foreground hover:text-foreground hover:border-border/80"
          >
            Go home
          </Link>
        </div>
        {error.digest && (
          <p className="text-xs text-muted-foreground/50 mt-4 font-mono">
            {error.digest}
          </p>
        )}
      </div>
    </div>
  )
}
