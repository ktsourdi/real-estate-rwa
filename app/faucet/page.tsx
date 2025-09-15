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

export default function FaucetPage() {
  const { address } = useAccount()
  const [to, setTo] = useState<string>('')
  const [amount, setAmount] = useState<string>('100')
  const { toast } = useToast()

  const handleMint = async () => {
    const target = (to || address || '').toString()
    if (!target) {
      toast({ title: 'Connect wallet', description: 'Please connect a wallet or enter an address.' })
      return
    }
    const amt = Number(amount || '0')
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
      toast({ title: 'DUSD minted', description: `Minted ${amt} DUSD to ${target.slice(0,6)}…${target.slice(-4)}` })
    } catch (e: any) {
      loader?.remove()
      toast({ title: 'Faucet error', description: e?.message || 'Failed to mint', variant: 'destructive' })
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
              <Input id="amt" type="number" min={1} step={1} value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div className="text-sm text-muted-foreground">
              Contract: <code className="font-mono">{process.env.NEXT_PUBLIC_USD}</code>
            </div>
            <div className="flex gap-2">
              {[50, 100, 250].map((v) => (
                <Button key={v} variant="outline" onClick={() => setAmount(String(v))}>{v}</Button>
              ))}
            </div>
            <Button className="w-full" onClick={handleMint}>Mint</Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}


