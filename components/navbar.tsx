'use client'

import { Button } from '@/components/ui/button'
import { ModeToggle } from '@/components/mode-toggle'
import { Wallet } from 'lucide-react'

export function Navbar() {
  return (
    <header className="bg-card/95 backdrop-blur-xl border-b border-border/50 shadow-sm">
      <div className="flex h-16 items-center justify-between px-6 ml-0 md:ml-64">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" className="hidden sm:flex border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-950/50 transition-all duration-200">
            <Wallet className="w-4 h-4 mr-2" />
            Connect Wallet
          </Button>
          <Button variant="outline" size="sm" className="sm:hidden border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-950/50">
            <Wallet className="w-4 h-4" />
          </Button>
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}