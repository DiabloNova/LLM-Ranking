import { Skeleton } from '@/components/ui/skeleton'

export default function LocaleLoading() {
  return (
    <main className="mx-auto w-full max-w-[1600px] px-4 py-8 md:px-8" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading page</span>
      <div className="space-y-4"><Skeleton className="h-8 w-56" /><Skeleton className="h-4 w-96 max-w-full" /></div>
      <div className="mt-10 grid gap-4 md:grid-cols-3"><Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" /></div>
      <Skeleton className="mt-6 h-72 w-full" />
    </main>
  )
}
