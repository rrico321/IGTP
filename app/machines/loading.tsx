import { Skeleton } from '@/components/ui/skeleton'

export default function MachinesLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-start justify-between mb-8">
        <div>
          <Skeleton className="h-7 w-36 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-9 w-36 rounded-lg" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    </div>
  )
}
