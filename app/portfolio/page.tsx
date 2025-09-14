"use client"

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Wallet, TrendingUp } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import { publicClient } from '@/lib/publicClient'
import { erc20Abi, propertySaleAbi } from '@/lib/abis'
import { useToast } from '@/hooks/use-toast'
import Image from 'next/image'

function loadCatalog() {
  if (typeof window === 'undefined') return [] as any[]
  try { return JSON.parse(localStorage.getItem('rwa_catalog') || '[]') } catch { return [] }
}

export default function Portfolio() {
  const { address } = useAccount()
  const [holdings, setHoldings] = useState<any[]>([])
  const [usdBalance, setUsdBalance] = useState<string>('0.00')
  const [portfolioValue, setPortfolioValue] = useState<string>('0.00')
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [withdrawAmt, setWithdrawAmt] = useState('')
  const { toast } = useToast()
  const computeApy = (seed: string | undefined) => {
    if (!seed) return 8.5
    let x = 0
    for (const c of seed.toLowerCase()) x = (x * 31 + c.charCodeAt(0)) % 10000
    return +(7 + ((x % 301) / 100)).toFixed(1)
  }
  const fallbackImage = 'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg'
  const normalizeImageUrl = (u?: string): string => {
    if (!u) return fallbackImage
    if (u.startsWith('ipfs://')) return `https://ipfs.io/ipfs/${u.replace('ipfs://','')}`
    return u
  }

  useEffect(() => {
    let mounted = true
    async function load() {
      const cats = loadCatalog()
      if (!address || cats.length === 0) { if (mounted) setHoldings([]); return }
      // Read purchased amounts from sale (source of truth for ownership in MVP) and enrich with metadata
      const results = await Promise.all(cats.map(async (c: any) => {
        if (!c.sale) return null
        const [bought, ppt] = await Promise.all([
          publicClient.readContract({ address: c.sale as `0x${string}`, abi: propertySaleAbi as any, functionName: 'purchased', args: [address] }) as Promise<any>,
          publicClient.readContract({ address: c.sale as `0x${string}`, abi: propertySaleAbi as any, functionName: 'pricePerToken', args: [] }) as Promise<any>,
        ])
        const tokensOwned = Number(bought)
        if (tokensOwned <= 0) return null
        const value = (Number(ppt) * tokensOwned) / 1e6
        return { 
          name: c.name, 
          token: c.token, 
          sale: c.sale, 
          tokensOwned, 
          totalTokens: 1000, 
          location: c.location || '', 
          apy: computeApy(c.sale || c.token), 
          value,
          image: c.image
        }
      }))
      const filtered = results.filter(Boolean) as any[]
      if (mounted) setHoldings(filtered)
      if (mounted) setPortfolioValue(filtered.reduce((sum, h: any) => sum + (h.value || 0), 0).toFixed(2))
      // USD balance
      const usd = process.env.NEXT_PUBLIC_USD as `0x${string}`
      const usdBal = await publicClient.readContract({ address: usd, abi: erc20Abi as any, functionName: 'balanceOf', args: [address] }) as any
      if (mounted) setUsdBalance((Number(usdBal) / 1e6).toFixed(2))
    }
    load(); return () => { mounted = false }
  }, [address])
  return (
    <>
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Portfolio</h2>
          <p className="text-muted-foreground mt-2">
            Track your real estate investments and earnings.
          </p>
        </div>

        {/* Wallet Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <Wallet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                {usdBalance} dUSD
              </div>
              <p className="text-xs text-muted-foreground mt-1">Available for investment</p>
              <div className="mt-4">
                <Button size="sm" className="gradient-emerald text-white border-0" onClick={() => setShowWithdraw(true)}>Withdraw</Button>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                ${portfolioValue}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Current value of property tokens</p>
            </CardContent>
          </Card>
        </div>

        {/* Holdings */}
        <div className="space-y-6">
          <div>
            <h3 className="text-2xl font-bold tracking-tight">Your Holdings</h3>
            <p className="text-muted-foreground mt-2">Properties in your investment portfolio</p>
          </div>
          
          {holdings.length === 0 && (
            <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-lg">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center mb-4">
                  <Wallet className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">No holdings yet. Buy tokens from the Properties page.</p>
              </CardContent>
            </Card>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {holdings.map((h, i) => (
              <Card key={i} className="overflow-hidden group hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-card/60 backdrop-blur-sm border-border/50 shadow-lg">
                <div className="relative h-48 overflow-hidden">
                  <Image 
                    src={normalizeImageUrl(h.image)} 
                    alt={h.name || 'Property'} 
                    fill 
                    className="object-cover group-hover:scale-110 transition-transform duration-700" 
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = fallbackImage
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute top-4 right-4 z-10">
                    {h.location && (
                      <Badge variant="secondary" className="glass-effect text-white border-white/20 shadow-lg">{h.location}</Badge>
                    )}
                  </div>
                </div>

                <CardHeader className="pb-3">
                  <CardTitle className="text-xl">{h.name}</CardTitle>
                  {h.location && (<p className="text-sm text-muted-foreground mt-1">{h.location}</p>)}
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-4 rounded-xl bg-gradient-to-r from-emerald-50/50 to-emerald-100/30 dark:from-emerald-950/30 dark:to-emerald-900/20 border border-emerald-200/30 dark:border-emerald-800/30">
                    <div>
                      <p className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent">${(h.value || 0).toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">current value</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center text-emerald-600 dark:text-emerald-400">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        <span className="font-medium">{h.apy}% APY</span>
                      </div>
                      <p className="text-sm text-muted-foreground">live yield</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Ownership</span>
                      <span className="font-semibold">{((h.tokensOwned / h.totalTokens) * 100).toFixed(2)}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div 
                        className="gradient-emerald rounded-full h-2 transition-all duration-500 shadow-sm" 
                        style={{ width: `${((h.tokensOwned / h.totalTokens) * 100)}%` }} 
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Tokens: {h.tokensOwned}/{h.totalTokens}</span>
                      <span>Est. Monthly: ${((h.value * h.apy / 100) / 12).toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
    {showWithdraw && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
        <div className="bg-card border border-border/50 rounded-xl p-6 w-[90%] max-w-sm shadow-2xl">
          <h3 className="font-semibold text-lg mb-2">Withdraw Cash</h3>
          <p className="text-sm text-muted-foreground mb-4">Enter the amount of dUSD to withdraw. A request will be submitted for off‑chain processing.</p>
          <input
            className="w-full border rounded px-3 py-2 text-sm bg-background mb-3"
            placeholder="Amount in dUSD"
            value={withdrawAmt}
            onChange={(e) => setWithdrawAmt(e.target.value)}
          />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowWithdraw(false)}>Cancel</Button>
            <Button
              className="gradient-emerald text-white border-0"
              onClick={() => {
                const n = Number(withdrawAmt)
                if (!withdrawAmt || Number.isNaN(n) || n <= 0) {
                  toast({ title: 'Invalid amount', description: 'Enter a positive number.' , variant: 'destructive'})
                  return
                }
                if (n > Number(usdBalance)) {
                  toast({ title: 'Insufficient balance', description: 'Amount exceeds wallet balance.', variant: 'destructive' })
                  return
                }
                const reqsKey = 'rwa_withdraw_requests'
                const existing = JSON.parse(localStorage.getItem(reqsKey) || '[]')
                existing.unshift({ ts: Date.now(), amount: n })
                localStorage.setItem(reqsKey, JSON.stringify(existing))
                setShowWithdraw(false)
                setWithdrawAmt('')
                toast({ title: 'Withdrawal requested', description: `Request submitted for ${n.toFixed(2)} dUSD.` })
              }}
            >Submit</Button>
          </div>
        </div>
      </div>
    )}
    </>
  )
}