'use client'

import { useRouter, useSearchParams } from 'next/navigation'

const PERIODS = [
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
  { label: 'This Year', value: 'year' },
  { label: 'All Time', value: 'all' },
] as const

export function TimeFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const current = searchParams.get('period') || 'month'

  function setPeriod(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('period', value)
    router.replace(`/?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-0.5">
      {PERIODS.map(({ label, value }) => (
        <button
          key={value}
          onClick={() => setPeriod(value)}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            current === value
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
