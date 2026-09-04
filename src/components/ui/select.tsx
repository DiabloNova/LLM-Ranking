import * as React from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

type SelectProps = React.ComponentProps<'select'> & { error?: boolean }

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({ className, error = false, children, ...props }, ref) => (
  <span className="relative block">
    <select ref={ref} data-slot="select" aria-invalid={error || props['aria-invalid'] || undefined} className={cn('flex h-11 w-full appearance-none rounded-lg border bg-[var(--background)] px-3 pe-10 text-sm text-[var(--foreground)] shadow-[var(--shadow-sm)] transition-colors focus-visible:border-[var(--sky-blue-500)] focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--sky-blue-500)_28%,transparent)] disabled:cursor-not-allowed disabled:opacity-50', error ? 'border-[var(--color-error)] focus-visible:ring-[color-mix(in_srgb,var(--color-error)_28%,transparent)]' : 'border-[var(--border-strong)]', className)} {...props}>{children}</select>
    <ChevronDown size={16} aria-hidden="true" className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
  </span>
))
Select.displayName = 'Select'

export { Select }
