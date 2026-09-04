import * as React from 'react'
import { cn } from '@/lib/utils'

function Label({ className, ...props }: React.ComponentProps<'label'>) {
  return <label data-slot="label" className={cn('text-sm font-medium leading-6 text-[var(--foreground)] peer-disabled:cursor-not-allowed peer-disabled:opacity-60', className)} {...props} />
}

export { Label }
