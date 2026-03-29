import { Skeleton } from '@/components/ui/skeleton'

export default function RequestsLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <Skeleton className="h-7 w-36 mb-2" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
    </div>
  )
}
