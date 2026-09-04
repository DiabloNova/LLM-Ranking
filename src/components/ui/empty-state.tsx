import * as React from 'react'
import { Inbox } from 'lucide-react'
import { cn } from '@/lib/utils'

function EmptyState({ title, description, action, className }: { title: string; description: string; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex min-h-52 flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--muted-surface)] px-6 py-10 text-center', className)}>
      <span className="mb-4 grid size-11 place-items-center rounded-full bg-[var(--background)] text-[var(--text-muted)]" aria-hidden="true"><Inbox size={20} /></span>
      <h3 className="text-base font-semibold text-[var(--foreground)]">{title}</h3>
      <p className="mt-2 max-w-[48ch] text-sm leading-6 text-[var(--text-muted)]">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}

export { EmptyState }
