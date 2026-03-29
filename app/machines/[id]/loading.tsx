import { Skeleton } from '@/components/ui/skeleton'

export default function MachineDetailLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Skeleton className="h-3 w-24 mb-4" />
      <div className="flex items-center gap-3 mb-1">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <Skeleton className="h-4 w-36 mb-8" />
      <Skeleton className="h-48 w-full rounded-xl mb-4" />
    </div>
  )
}
