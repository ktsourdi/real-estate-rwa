'use client'

import { ModeToggle } from '@/components/mode-toggle'
import { ConnectButton } from '@/components/connect-button'

export function Navbar() {
  return (
    <header className="bg-card/95 backdrop-blur-xl border-b border-border/50 shadow-sm">
      <div className="flex h-16 items-center justify-between px-6 ml-0 md:ml-64">
        <div className="flex items-center space-x-4 ml-12 md:ml-0">
          <h1 className="text-2xl font-semibold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
            Real Estate Dashboard
          </h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <ConnectButton />
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}