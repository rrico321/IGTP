import { Skeleton } from '@/components/ui/skeleton'

export default function BrowseLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <Skeleton className="h-7 w-44 mb-2" />
        <Skeleton className="h-4 w-52" />
      </div>
      <Skeleton className="h-12 w-full rounded-xl mb-6" />
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    </div>
  )
}
