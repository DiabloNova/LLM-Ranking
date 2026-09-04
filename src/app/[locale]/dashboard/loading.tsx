import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading dashboard</span>
      <div className="flex items-end justify-between gap-4"><div className="space-y-3"><Skeleton className="h-8 w-64" /><Skeleton className="h-4 w-80 max-w-[60vw]" /></div><Skeleton className="hidden h-11 w-32 sm:block" /></div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" /></div>
      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]"><Skeleton className="h-80" /><Skeleton className="h-80" /></div>
    </div>
  )
}
