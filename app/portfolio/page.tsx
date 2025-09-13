"use client"

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Wallet } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import { publicClient } from '@/lib/publicClient'
import { erc20Abi } from '@/lib/abis'

function loadCatalog() {
  if (typeof window === 'undefined') return [] as any[]
  try { return JSON.parse(localStorage.getItem('rwa_catalog') || '[]') } catch { return [] }
}

export default function Portfolio() {
  const { address } = useAccount()
  const [holdings, setHoldings] = useState<any[]>([])
  const [usdBalance, setUsdBalance] = useState<string>('0.00')

  useEffect(() => {
    let mounted = true
    async function load() {
      const cats = loadCatalog()
      if (!address || cats.length === 0) { if (mounted) setHoldings([]); return }
      // Read balances for each property token
      const results = await Promise.all(cats.map(async (c: any) => {
        if (!c.token) return null
        const bal = await publicClient.readContract({ address: c.token as `0x${string}`, abi: erc20Abi as any, functionName: 'balanceOf', args: [address] }) as any
        return { name: c.name, token: c.token, sale: c.sale, tokensOwned: Number(bal), totalTokens: 1000 }
      }))
      const filtered = results.filter(Boolean) as any[]
      if (mounted) setHoldings(filtered)
      // USD balance
      const usd = process.env.NEXT_PUBLIC_USD as `0x${string}`
      const usdBal = await publicClient.readContract({ address: usd, abi: erc20Abi as any, functionName: 'balanceOf', args: [address] }) as any
      if (mounted) setUsdBalance((Number(usdBal) / 1e6).toFixed(2))
    }
    load(); return () => { mounted = false }
  }, [address])
  return (
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
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Invested</CardTitle>
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <Building className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                €{walletData.totalInvested}
              </div>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">Across {holdings.length} properties</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Value</CardTitle>
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                €{walletData.totalValue}
              </div>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">+{walletData.totalYield} total return</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Income</CardTitle>
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                €{walletData.monthlyIncome}
              </div>
              <p className="text-xs text-muted-foreground mt-1">From rent distributions</p>
            </CardContent>
          </Card>
        </div>

        {/* Holdings */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-lg">
          <CardHeader>
            <CardTitle>Your Holdings</CardTitle>
            <CardDescription>
              Properties in your investment portfolio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {holdings.length === 0 && (
                <p className="text-sm text-muted-foreground">No holdings yet. Buy tokens from the Properties page.</p>
              )}
              {holdings.map((h, i) => (
                <div key={i} className="border border-border/50 rounded-xl p-6 space-y-4 bg-gradient-to-r from-muted/20 to-muted/10 hover:from-muted/30 hover:to-muted/20 transition-all duration-300 hover:shadow-md">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{h.name}</h3>
                      <p className="text-sm text-muted-foreground">Token: {h.token}</p>
                    </div>
                    <Badge variant="outline" className="self-start sm:self-center mt-2 sm:mt-0 border-emerald-200 text-emerald-700 dark:border-emerald-800 dark:text-emerald-300">
                      {((h.tokensOwned / h.totalTokens) * 100).toFixed(2)}% ownership
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Tokens Owned</p>
                      <p className="font-semibold">{h.tokensOwned}/{h.totalTokens}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Sale</p>
                      <p className="font-semibold">{h.sale}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}