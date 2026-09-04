'use client'

import { useEffect } from 'react'
import { RefreshCw, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function LocaleError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Keep the boundary quiet in production while still making failures observable in dev.
    if (process.env.NODE_ENV !== 'production') console.error('Localized route error')
  }, [])

  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-2xl flex-col items-center justify-center px-6 py-16 text-center">
      <span className="mb-5 grid size-14 place-items-center rounded-full bg-[var(--color-error-bg)] text-[var(--color-error)]" aria-hidden="true"><TriangleAlert size={26} /></span>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">Unexpected error</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-[var(--foreground)]">This page needs another try.</h1>
      <p className="mt-3 max-w-[52ch] text-sm leading-6 text-[var(--text-muted)]">Something failed while loading this workspace view. Your saved work is safe. Retry first, then contact support if it keeps happening.</p>
      <Button type="button" onClick={() => reset()} className="mt-7 min-h-11 gap-2"><RefreshCw size={16} aria-hidden="true" /> Try again</Button>
    </main>
  )
}
