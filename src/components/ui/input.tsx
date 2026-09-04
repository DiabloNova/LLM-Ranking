import * as React from 'react'
import { cn } from '@/lib/utils'

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, type, ...props }, ref) => (
    <input ref={ref} type={type} data-slot="input" className={cn('flex h-11 w-full rounded-lg border border-[var(--border-strong)] bg-[var(--background)] px-3 text-sm text-[var(--foreground)] shadow-[var(--shadow-sm)] transition-colors placeholder:text-[var(--text-muted)] focus-visible:border-[var(--sky-blue-500)] focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--sky-blue-500)_28%,transparent)] disabled:cursor-not-allowed disabled:opacity-50', className)} {...props} />
  ),
)
Input.displayName = 'Input'

export { Input }
