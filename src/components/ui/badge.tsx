import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva('inline-flex min-h-6 items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold leading-5', {
  variants: {
    variant: {
      default: 'border-transparent bg-[var(--color-primary-600)] text-white',
      secondary: 'border-[var(--border)] bg-[var(--muted-surface)] text-[var(--foreground)]',
      outline: 'border-[var(--border-strong)] bg-transparent text-[var(--foreground)]',
      success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
      warning: 'border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300',
      destructive: 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300',
    },
  },
  defaultVariants: { variant: 'default' },
})

function Badge({ className, variant, ...props }: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
  return <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
