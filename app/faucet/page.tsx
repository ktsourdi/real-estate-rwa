"use client"
import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAccount } from 'wagmi'
import { useToast } from '@/hooks/use-toast'
import { showLoading, confettiBurst } from '@/lib/confetti'
import { publicClient } from '@/lib/publicClient'
import { erc20Abi } from '@/lib/abis'
import { useEffect } from 'react'

export default function FaucetPage() {
  const { address } = useAccount()
  const [to, setTo] = useState<string>('')
  const [amount, setAmount] = useState<string>('100')
  const { toast } = useToast()
  const usd = process.env.NEXT_PUBLIC_USD as `0x${string}`

  const handleMint = async () => {
    const target = (to || address || '').toString()
    if (!target) {
      toast({ title: 'Connect wallet', description: 'Please connect a wallet or enter an address.' })
      return
    }
    const amt = Math.min(10000, Number(amount || '0'))
    if (!Number.isFinite(amt) || amt <= 0) {
      toast({ title: 'Invalid amount', description: 'Enter a positive number.' })
      return
    }
    const loader = showLoading()
    try {
      const res = await fetch('/api/faucet', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to: target, amount: amt }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Mint failed')

      // Wait for confirmation so UI reflects updated balance
      if (data.hash) {
        await publicClient.waitForTransactionReceipt({ hash: data.hash as `0x${string}` })
      }
      loader?.remove()
      confettiBurst()
      const minted = data.minted ?? amt
      toast({ title: 'DUSD minted', description: `Minted ${minted} DUSD to ${target.slice(0,6)}…${target.slice(-4)}` })
    } catch (e: any) {
      loader?.remove()
      toast({ title: 'Faucet error', description: e?.message || 'Failed to mint', variant: 'destructive' })
    }
  }

  const addTokenToWallet = async () => {
    try {
      if (!(window as any).ethereum) {
        toast({ title: 'No wallet', description: 'Install or open your wallet extension.' })
        return
      }
      await (window as any).ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: usd,
            symbol: 'dUSD',
            decimals: 6,
          },
        },
      })
    } catch (e: any) {
      toast({ title: 'Add token failed', description: e?.message || 'Could not add token', variant: 'destructive' })
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">DUSD Faucet</h2>
          <p className="text-muted-foreground mt-2">Mint demo USD to your wallet on Sepolia.</p>
        </div>
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle>Request Tokens</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="to" className="text-sm text-muted-foreground">Recipient</label>
              <Input id="to" placeholder={address || '0x...'} value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label htmlFor="amt" className="text-sm text-muted-foreground">Amount (DUSD)</label>
              <Input
                id="amt"
                type="number"
                min={1}
                max={10000}
                step={1}
                value={amount}
                onChange={(e) => {
                  const raw = e.target.value
                  if (raw === '') { setAmount(''); return }
                  const num = Math.floor(Number(raw))
                  if (!Number.isFinite(num)) { return }
                  const clamped = Math.max(1, Math.min(10000, num))
                  setAmount(String(clamped))
                }}
              />
              <p className="text-xs text-muted-foreground">Max per request: 10,000 DUSD</p>
            </div>
            <div className="text-sm text-muted-foreground">
              Contract: <code className="font-mono">{process.env.NEXT_PUBLIC_USD}</code>
            </div>
            <div className="flex gap-2">
              {[50, 100, 250].map((v) => (
                <Button key={v} variant="outline" onClick={() => setAmount(String(v))}>{v}</Button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button className="w-full" onClick={handleMint}>Mint</Button>
              <Button variant="secondary" onClick={addTokenToWallet}>Add to Wallet</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}


