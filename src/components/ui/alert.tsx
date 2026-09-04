import * as React from 'react'
import { cn } from '@/lib/utils'

const alertStyles = {
  default: 'border-[var(--border)] bg-[var(--muted-surface)] text-[var(--foreground)]',
  success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  warning: 'border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300',
  error: 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300',
  info: 'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300',
} as const

type AlertTone = keyof typeof alertStyles

function Alert({ tone = 'default', className, ...props }: React.ComponentProps<'div'> & { tone?: AlertTone }) {
  return <div role={tone === 'error' ? 'alert' : 'status'} data-slot="alert" className={cn('rounded-xl border px-4 py-3 text-sm leading-6', alertStyles[tone], className)} {...props} />
}

function AlertTitle({ className, ...props }: React.ComponentProps<'h4'>) {
  return <h4 data-slot="alert-title" className={cn('mb-1 font-semibold', className)} {...props} />
}

function AlertDescription({ className, ...props }: React.ComponentProps<'p'>) {
  return <p data-slot="alert-description" className={cn('text-current/80', className)} {...props} />
}

export { Alert, AlertTitle, AlertDescription }
