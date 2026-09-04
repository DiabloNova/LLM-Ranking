import * as React from 'react'
import { cn } from '@/lib/utils'

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<'textarea'>>(({ className, ...props }, ref) => (
  <textarea ref={ref} data-slot="textarea" className={cn('flex min-h-28 w-full resize-y rounded-lg border border-[var(--border-strong)] bg-[var(--background)] px-3 py-2.5 text-sm leading-6 text-[var(--foreground)] shadow-[var(--shadow-sm)] transition-colors placeholder:text-[var(--text-muted)] focus-visible:border-[var(--sky-blue-500)] focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--sky-blue-500)_28%,transparent)] disabled:cursor-not-allowed disabled:opacity-50', className)} {...props} />
))
Textarea.displayName = 'Textarea'

export { Textarea }
