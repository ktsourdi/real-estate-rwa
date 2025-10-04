'use client'

import { ModeToggle } from '@/components/mode-toggle'
import { ConnectButton } from '@/components/connect-button'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useAccount } from 'wagmi'
import { useEffect, useState } from 'react'
import { publicClient } from '@/lib/publicClient'
import { vaultAbi, erc20Abi } from '@/lib/abis'

export function Navbar() {
  const { address } = useAccount()
  const [decimals, setDecimals] = useState<number>(6)
  const [vaultBalance, setVaultBalance] = useState<bigint>(BigInt(0))
  const VAULT = process.env.NEXT_PUBLIC_VAULT as `0x${string}` | undefined
  const USD = process.env.NEXT_PUBLIC_USD as `0x${string}` | undefined

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        if (!address || !VAULT) { if (mounted) setVaultBalance(BigInt(0)); return }
        if (USD) {
          try {
            const d = await publicClient.readContract({ address: USD, abi: erc20Abi as any, functionName: 'decimals', args: [] }) as any
            if (mounted) setDecimals(Number(d || 6))
          } catch {}
        }
        const bal = await publicClient.readContract({ address: VAULT, abi: vaultAbi as any, functionName: 'balanceOf', args: [address] }) as any
        if (mounted) setVaultBalance(BigInt(bal || 0))
      } catch { if (mounted) setVaultBalance(BigInt(0)) }
    }
    load(); return () => { mounted = false }
  }, [address])

  const formatted = (() => {
    const denom = Math.max(1, Math.pow(10, decimals || 6))
    return (Number(vaultBalance) / denom).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  })()

  return (
    <header className="bg-card/95 backdrop-blur-xl border-b border-border/50 shadow-sm">
      <div className="flex h-16 items-center justify-between px-6 ml-0 md:ml-64">
        <div className="flex items-center space-x-4 ml-12 md:ml-0">
         
        </div>
        
        <div className="flex items-center space-x-4">
          {address && VAULT && (
            <div className="px-3 py-1.5 rounded-lg bg-muted/40 text-xs text-muted-foreground">
              In-app DUSD: <span className="font-medium text-foreground">{formatted}</span>
            </div>
          )}
          <Link href="/wallet"><Button size="sm" variant="outline">Wallet</Button></Link>
          <ConnectButton />
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}