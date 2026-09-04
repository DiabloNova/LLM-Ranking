'use client'

import { RefreshCw, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function DashboardError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center py-12"><div className="max-w-lg text-center"><span className="mx-auto grid size-12 place-items-center rounded-full bg-[var(--color-error-bg)] text-[var(--color-error)]" aria-hidden="true"><TriangleAlert size={22} /></span><h1 className="mt-5 text-2xl font-bold text-[var(--foreground)]">Dashboard data could not load.</h1><p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">The workspace is still available. Retry the request without leaving this page.</p><Button type="button" onClick={() => reset()} className="mt-6 min-h-11 gap-2"><RefreshCw size={16} aria-hidden="true" /> Retry</Button></div></div>
  )
}
