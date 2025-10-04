"use client"

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAccount, useWriteContract } from 'wagmi'
import { useEffect, useMemo, useState } from 'react'
import { erc20Abi, vaultAbi } from '@/lib/abis'
import { publicClient } from '@/lib/publicClient'
import { useToast } from '@/hooks/use-toast'

const USD = process.env.NEXT_PUBLIC_USD as `0x${string}`
const VAULT = process.env.NEXT_PUBLIC_VAULT as `0x${string}`

export default function WalletPage() {
  const { address } = useAccount()
  const { writeContractAsync } = useWriteContract()
  const { toast } = useToast()

  const [decimals, setDecimals] = useState<number>(6)
  const [tokenBal, setTokenBal] = useState<bigint>(BigInt(0))
  const [vaultBal, setVaultBal] = useState<bigint>(BigInt(0))
  const [feeBps, setFeeBps] = useState<number>(200)
  const [amount, setAmount] = useState<string>("")

  const fmt = (v: bigint) => (Number(v) / 10 ** decimals).toLocaleString(undefined, { maximumFractionDigits: decimals })
  const parse = (s: string) => BigInt(Math.round((parseFloat(s || '0') || 0) * 10 ** decimals))

  async function load() {
    if (!address) { setTokenBal(BigInt(0)); setVaultBal(BigInt(0)); return }
    try {
      const [d, tb, vb, fb] = await Promise.all([
        publicClient.readContract({ address: USD, abi: erc20Abi as any, functionName: 'decimals', args: [] }) as any,
        publicClient.readContract({ address: USD, abi: erc20Abi as any, functionName: 'balanceOf', args: [address] }) as any,
        publicClient.readContract({ address: VAULT, abi: vaultAbi as any, functionName: 'balanceOf', args: [address] }) as any,
        publicClient.readContract({ address: VAULT, abi: vaultAbi as any, functionName: 'feeBps', args: [] }) as any,
      ])
      setDecimals(Number(d||6)); setTokenBal(BigInt(tb||0)); setVaultBal(BigInt(vb||0)); setFeeBps(Number(fb||200))
    } catch {}
  }

  useEffect(() => { load() }, [address])

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Wallet</h2>
          <p className="text-muted-foreground mt-2">Deposit DUSD to your in-app balance for gasless trading. Withdrawals have a {feeBps/100}% fee.</p>
        </div>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-lg">
          <CardHeader>
            <CardTitle>Balances</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-muted-foreground">Browser DUSD: <span className="font-semibold text-foreground">{fmt(tokenBal)}</span></div>
            <div className="text-sm text-muted-foreground">In-app DUSD: <span className="font-semibold text-foreground">{fmt(vaultBal)}</span></div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-lg">
          <CardHeader>
            <CardTitle>Deposit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <input className="w-full h-11 rounded-lg border border-border/60 px-3 bg-background/80" placeholder="Amount" value={amount} onChange={(e)=> setAmount(e.target.value)} />
            <div className="flex gap-3">
              <Button onClick={async ()=>{
                try {
                  if (!address) return
                  const amt = parse(amount)
                  if (amt <= BigInt(0)) return
                  const allowance = await publicClient.readContract({ address: USD, abi: erc20Abi as any, functionName: 'allowance', args: [address, VAULT] }) as any
                  if (BigInt(allowance||0) < amt) {
                    await writeContractAsync({ address: USD, abi: erc20Abi, functionName: 'approve', args: [VAULT, amt] })
                  }
                  await writeContractAsync({ address: VAULT, abi: vaultAbi, functionName: 'deposit', args: [amt] })
                  toast({ title: 'Deposited', description: 'Funds moved to in-app wallet' })
                  setAmount(""); load()
                } catch (e:any) { toast({ title: 'Deposit failed', description: e?.message || 'Error', variant: 'destructive' }) }
              }}>Deposit</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-lg">
          <CardHeader>
            <CardTitle>Withdraw</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <input className="w-full h-11 rounded-lg border border-border/60 px-3 bg-background/80" placeholder="Amount" value={amount} onChange={(e)=> setAmount(e.target.value)} />
            <div className="text-xs text-muted-foreground">Fee: {feeBps/100}% will be deducted</div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={async ()=>{
                try {
                  if (!address) return
                  const amt = parse(amount)
                  if (amt <= BigInt(0)) return
                  await writeContractAsync({ address: VAULT, abi: vaultAbi, functionName: 'withdraw', args: [amt] })
                  toast({ title: 'Withdrawal submitted', description: 'Network fees apply' })
                  setAmount(""); load()
                } catch (e:any) { toast({ title: 'Withdraw failed', description: e?.message || 'Error', variant: 'destructive' }) }
              }}>Withdraw</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}


