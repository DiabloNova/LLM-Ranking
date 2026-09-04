import * as React from 'react'
import { cn } from '@/lib/utils'

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return <div role="status" aria-label="Loading" data-slot="skeleton" className={cn('skeleton-shimmer rounded-md', className)} {...props} />
}

export { Skeleton }
