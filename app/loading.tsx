import { Skeleton } from '@/components/ui/skeleton'

export default function HomeLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-12">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="mb-4 flex items-center justify-between">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-3 w-20" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    </div>
  )
}
