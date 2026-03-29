import { Skeleton } from '@/components/ui/skeleton'

export default function TrustLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <Skeleton className="h-7 w-36 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-10 w-full rounded-lg mb-8" />
      <Skeleton className="h-3 w-32 mb-3" />
      <div className="space-y-2">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    </div>
  )
}
