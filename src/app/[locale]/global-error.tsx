'use client'

import { useEffect } from 'react'

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { if (process.env.NODE_ENV !== 'production') console.error('Global application error') }, [])
  return (
    <html lang="en"><body className="bg-slate-950 text-slate-100"><main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 text-center"><h1 className="text-3xl font-bold">The application needs a restart.</h1><p className="mt-3 text-sm leading-6 text-slate-300">A full-page error occurred. Try reloading the application.</p><button type="button" onClick={() => reset()} className="mt-7 min-h-11 rounded-lg bg-sky-500 px-5 text-sm font-semibold text-slate-950 focus-visible:outline focus-visible:outline-3 focus-visible:outline-sky-300">Reload</button></main></body></html>
  )
}
