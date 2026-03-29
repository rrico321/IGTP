import { Skeleton } from '@/components/ui/skeleton'

export default function BrowseDetailLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Skeleton className="h-3 w-20 mb-4" />
      <div className="flex items-center gap-3 mb-1">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <Skeleton className="h-4 w-48 mb-8" />
      <Skeleton className="h-40 w-full rounded-xl mb-4" />
      <Skeleton className="h-32 w-full rounded-xl" />
    </div>
  )
}
