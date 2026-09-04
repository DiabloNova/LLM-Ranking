'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

type TabsContextValue = { value: string; setValue: (value: string) => void; baseId: string }
const TabsContext = React.createContext<TabsContextValue | null>(null)
function useTabsContext(component: string) { const context = React.useContext(TabsContext); if (!context) throw new Error(`${component} must be used inside Tabs`); return context }

type TabsProps = React.ComponentProps<'div'> & { defaultValue: string; value?: string; onValueChange?: (value: string) => void }
function Tabs({ defaultValue, value: controlledValue, onValueChange, className, children, ...props }: TabsProps) {
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue)
  const value = controlledValue ?? uncontrolledValue
  const baseId = React.useId()
  const setValue = React.useCallback((nextValue: string) => { if (controlledValue === undefined) setUncontrolledValue(nextValue); onValueChange?.(nextValue) }, [controlledValue, onValueChange])
  return <TabsContext.Provider value={{ value, setValue, baseId }}><div data-slot="tabs" className={cn('w-full', className)} {...props}>{children}</div></TabsContext.Provider>
}

function TabsList({ className, ...props }: React.ComponentProps<'div'>) {
  return <div role="tablist" data-slot="tabs-list" className={cn('inline-flex min-h-11 max-w-full items-center gap-1 overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--muted-surface)] p-1', className)} {...props} />
}

type TabsTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string }
function TabsTrigger({ value, className, children, onKeyDown, ...props }: TabsTriggerProps) {
  const { value: activeValue, setValue, baseId } = useTabsContext('TabsTrigger')
  const active = activeValue === value
  const triggerId = `${baseId}-trigger-${value}`
  const panelId = `${baseId}-panel-${value}`
  return <button type="button" role="tab" id={triggerId} aria-selected={active} aria-controls={panelId} tabIndex={active ? 0 : -1} data-slot="tabs-trigger" className={cn('min-h-9 shrink-0 rounded-md px-3 text-sm font-medium text-[var(--text-muted)] transition-colors focus-visible:outline focus-visible:outline-3 focus-visible:outline-[var(--sky-blue-500)]', active ? 'bg-[var(--card)] text-[var(--foreground)] shadow-[var(--shadow-sm)]' : 'hover:text-[var(--foreground)]', className)} onClick={() => setValue(value)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setValue(value) }; onKeyDown?.(event) }} {...props}>{children}</button>
}

function TabsContent({ value, className, children, ...props }: React.ComponentProps<'div'> & { value: string }) {
  const { value: activeValue, baseId } = useTabsContext('TabsContent')
  if (activeValue !== value) return null
  return <div role="tabpanel" id={`${baseId}-panel-${value}`} aria-labelledby={`${baseId}-trigger-${value}`} tabIndex={0} data-slot="tabs-content" className={cn('mt-4 outline-none focus-visible:outline focus-visible:outline-3 focus-visible:outline-[var(--sky-blue-500)]', className)} {...props}>{children}</div>
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
