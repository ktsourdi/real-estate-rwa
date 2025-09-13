"use client"

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Building, TrendingUp, Wallet, Receipt } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useAccount } from 'wagmi'
import { publicClient } from '@/lib/publicClient'
import { decodeEventLog } from 'viem'
import { propertySaleAbi } from '@/lib/abis'

function loadCatalog() {
  if (typeof window === 'undefined') return [] as any[]
  try { return JSON.parse(localStorage.getItem('rwa_catalog') || '[]') } catch { return [] }
}

export default function Dashboard() {
  const { address } = useAccount()
  const [totalInvested, setTotalInvested] = useState<number>(0)
  const [recent, setRecent] = useState<any[]>([])
  const [propertiesCount, setPropertiesCount] = useState<number>(0)
  const [avgApy, setAvgApy] = useState<number>(0)
  const [monthlyIncome, setMonthlyIncome] = useState<number>(0)

  const computeApy = (seed?: string) => {
    if (!seed) return 8.5
    let x = 0
    for (const c of seed.toLowerCase()) x = (x * 31 + c.charCodeAt(0)) % 10000
    return +(7 + ((x % 301) / 100)).toFixed(1)
  }

  useEffect(() => {
    let mounted = true
    async function load() {
      const catalog = loadCatalog()
      setPropertiesCount(catalog.length)
      if (!address || catalog.length === 0) { if (mounted) { setTotalInvested(0); setRecent([]) } ; return }
      // Aggregate buys from events
      let total = 0
      const latest: any[] = []
      const investedByKey: Record<string, number> = {}
      for (const c of catalog) {
        if (!c.sale) continue
        try {
          const logs = await publicClient.getLogs({ address: c.sale as `0x${string}`, fromBlock: 'earliest', toBlock: 'latest' })
          for (const log of logs) {
            try {
              const parsed = decodeEventLog({ abi: propertySaleAbi as any, data: log.data, topics: log.topics }) as any
              if (parsed.eventName === 'Purchased' && parsed.args?.buyer?.toLowerCase() === address?.toLowerCase()) {
                const cost = Number(parsed.args.cost) / 1e6
                total += cost
                const key = (c.sale || c.token || '').toLowerCase()
                investedByKey[key] = (investedByKey[key] || 0) + cost
                const block = await publicClient.getBlock({ blockHash: log.blockHash as `0x${string}` })
                latest.push({
                  title: c.name,
                  location: c.location || '',
                  invested: `$${cost.toFixed(2)}`,
                  status: 'active',
                  ts: Number(block.timestamp)
                })
              }
            } catch {}
          }
        } catch {}
      }
      latest.sort((a,b) => b.ts - a.ts)
      let weighted = 0
      for (const k of Object.keys(investedByKey)) weighted += investedByKey[k] * computeApy(k)
      const apy = total > 0 ? weighted / total : 0
      const monthly = (total * (apy/100)) / 12
      if (mounted) {
        setTotalInvested(total)
        setRecent(latest.slice(0,3))
        setAvgApy(apy)
        setMonthlyIncome(monthly)
      }
    }
    load(); return () => { mounted = false }
  }, [address])

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground mt-2">
            Welcome back! Here's your investment overview.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Invested</CardTitle>
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <Wallet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                ${totalInvested.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">All time</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Properties</CardTitle>
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <Building className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{propertiesCount}</div>
              <p className="text-xs text-muted-foreground mt-1">In catalog</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Annual Yield</CardTitle>
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgApy.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground mt-1">Weighted by invested</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Income</CardTitle>
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <Receipt className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${monthlyIncome.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">Estimated from APY</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Properties */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-lg">
          <CardHeader>
            <CardTitle>Your Recent Investments</CardTitle>
            <CardDescription>
              Properties you've recently invested in
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recent.map((property, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 border border-border/50 rounded-xl bg-muted/20 hover:bg-muted/40 transition-all duration-200 hover:shadow-md">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 gradient-emerald-subtle rounded-xl flex items-center justify-center border border-emerald-200/50 dark:border-emerald-800/50">
                      <Building className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="font-medium">{property.title}</p>
                      <p className="text-sm text-muted-foreground">{property.location}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{property.invested}</p>
                    <div className="flex items-center space-x-2">
                      <Badge variant={'default'}>
                        {property.status}
                      </Badge>
                      <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">&nbsp;</span>
                    </div>
                  </div>
                </div>
              ))}
              {recent.length === 0 && (
                <p className="text-sm text-muted-foreground">No recent investments yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}