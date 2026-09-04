import Link from 'next/link'
import { ArrowLeft, SearchX } from 'lucide-react'

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-2xl flex-col items-center justify-center px-6 py-16 text-center">
      <span className="mb-5 grid size-14 place-items-center rounded-full bg-[var(--muted-surface)] text-[var(--text-muted)]" aria-hidden="true"><SearchX size={26} /></span>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">404</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-[var(--foreground)]">That page is not here.</h1>
      <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">The link may be outdated, or the page may have moved.</p>
      <Link href="/" className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-lg bg-[var(--color-primary-600)] px-5 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-3 focus-visible:outline-[var(--sky-blue-500)]"><ArrowLeft size={16} aria-hidden="true" /> Back home</Link>
    </main>
  )
}
