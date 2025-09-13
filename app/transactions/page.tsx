"use client"

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import { publicClient } from '@/lib/publicClient'
import { propertySaleAbi } from '@/lib/abis'

type TxRow = {
  date: string
  property: string
  type: 'Buy' | 'Refund' | 'Settle'
  tokens: number | '-' 
  amountUsd: string
  status: 'completed'
}

function loadCatalog() {
  if (typeof window === 'undefined') return [] as any[]
  try { return JSON.parse(localStorage.getItem('rwa_catalog') || '[]') } catch { return [] }
}

export default function Transactions() {
  const { address } = useAccount()
  const [rows, setRows] = useState<TxRow[]>([])
  const [total, setTotal] = useState<number>(0)

  useEffect(() => {
    let mounted = true
    async function load() {
      if (!address) { if (mounted) { setRows([]); setTotal(0) } ; return }
      const catalog = loadCatalog()
      // Fetch logs for each sale where buyer is the user
      const all: TxRow[] = []
      let totalUsd = 0
      for (const item of catalog) {
        if (!item.sale) continue
        try {
          const logs = await publicClient.getLogs({
            address: item.sale as `0x${string}`,
            // topics: [signature, user as indexed],
            // viem can filter by eventName after decoding, but we filter by topic here for efficiency
            // We'll fetch all and filter client-side for simplicity for MVP
            fromBlock: 'earliest',
            toBlock: 'latest'
          })
          // Decode and filter
          for (const log of logs) {
            try {
              const parsed = publicClient.decodeEventLog({ abi: propertySaleAbi as any, data: log.data, topics: log.topics }) as any
              if (parsed.eventName === 'Purchased' && parsed.args?.buyer?.toLowerCase() === address.toLowerCase()) {
                const amount = Number(parsed.args.amount)
                const cost = Number(parsed.args.cost) / 1e6
                totalUsd += cost
                const block = await publicClient.getBlock({ blockHash: log.blockHash as `0x${string}` })
                all.push({
                  date: new Date(Number(block.timestamp) * 1000).toLocaleDateString(),
                  property: item.name,
                  type: 'Buy',
                  tokens: amount,
                  amountUsd: `$${cost.toFixed(2)}`,
                  status: 'completed'
                })
              } else if (parsed.eventName === 'Refunded' && parsed.args?.buyer?.toLowerCase() === address.toLowerCase()) {
                const refund = Number(parsed.args.refund) / 1e6
                totalUsd -= refund
                const block = await publicClient.getBlock({ blockHash: log.blockHash as `0x${string}` })
                all.push({
                  date: new Date(Number(block.timestamp) * 1000).toLocaleDateString(),
                  property: item.name,
                  type: 'Refund',
                  tokens: '-',
                  amountUsd: `-$${refund.toFixed(2)}`,
                  status: 'completed'
                })
              }
            } catch {}
          }
        } catch {}
      }
      all.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      if (mounted) { setRows(all); setTotal(totalUsd) }
    }
    load(); return () => { mounted = false }
  }, [address])

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Total Volume</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${total.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">All transactions</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-12 text-xs text-muted-foreground pb-2 border-b">
              <div className="col-span-2">Date</div>
              <div className="col-span-4">Property</div>
              <div className="col-span-2">Type</div>
              <div className="col-span-2">Tokens</div>
              <div className="col-span-2">Amount</div>
            </div>
            <div className="divide-y">
              {rows.map((r, i) => (
                <div key={i} className="grid grid-cols-12 py-3 items-center">
                  <div className="col-span-2 text-sm">{r.date}</div>
                  <div className="col-span-4 text-sm">{r.property}</div>
                  <div className="col-span-2"><Badge variant={r.type === 'Buy' ? 'secondary' : 'outline'}>{r.type}</Badge></div>
                  <div className="col-span-2 text-sm">{r.tokens}</div>
                  <div className="col-span-2 text-sm">{r.amountUsd}</div>
                </div>
              ))}
              {rows.length === 0 && (
                <div className="py-8 text-sm text-muted-foreground">No transactions yet.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const transactions = [
  {
    id: 1,
    date: "2024-01-15",
    property: "Athens Apartment",
    type: "Buy",
    amount: "€1,250.00",
    tokens: 50,
    status: "completed"
  },
  {
    id: 2,
    date: "2024-01-14",
    property: "Thessaloniki Loft",
    type: "Buy",
    amount: "€1,800.00",
    tokens: 100,
    status: "completed"
  },
  {
    id: 3,
    date: "2024-01-10",
    property: "Athens Apartment",
    type: "Rent",
    amount: "€28.50",
    tokens: null,
    status: "completed"
  },
  {
    id: 4,
    date: "2024-01-08",
    property: "Crete Villa",
    type: "Buy",
    amount: "€3,375.00",
    tokens: 75,
    status: "completed"
  },
  {
    id: 5,
    date: "2024-01-05",
    property: "Mykonos Hotel",
    type: "Buy",
    amount: "€3,000.00",
    tokens: 25,
    status: "completed"
  },
  {
    id: 6,
    date: "2024-01-03",
    property: "Thessaloniki Loft",
    type: "Rent",
    amount: "€78.40",
    tokens: null,
    status: "completed"
  },
  {
    id: 7,
    date: "2024-01-01",
    property: "Rhodes Apartment",
    type: "Buy",
    amount: "€2,100.00",
    tokens: 60,
    status: "pending"
  },
  {
    id: 8,
    date: "2023-12-28",
    property: "Crete Villa",
    type: "Rent",
    amount: "€180.00",
    tokens: null,
    status: "completed"
  },
  {
    id: 9,
    date: "2023-12-25",
    property: "Mykonos Hotel",
    type: "Rent",
    amount: "€196.88",
    tokens: null,
    status: "completed"
  },
  {
    id: 10,
    date: "2023-12-22",
    property: "Rhodes Apartment",
    type: "Rent",
    amount: "€108.50",
    tokens: null,
    status: "completed"
  }
]

const getTypeColor = (type: string) => {
  switch (type) {
    case 'Buy':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
    case 'Sell':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-800'
    case 'Rent':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
    default:
      return 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'default'
    case 'pending':
      return 'secondary'
    case 'failed':
      return 'destructive'
    default:
      return 'secondary'
  }
}

export default function Transactions() {
  const totalVolume = transactions
    .filter(t => t.status === 'completed')
    .reduce((sum, t) => sum + parseFloat(t.amount.replace('€', '').replace(',', '')), 0)

  const buyTransactions = transactions.filter(t => t.type === 'Buy' && t.status === 'completed')
  const rentTransactions = transactions.filter(t => t.type === 'Rent' && t.status === 'completed')

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Transactions</h2>
          <p className="text-muted-foreground mt-2">
            Complete history of your real estate investments and earnings.
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                €{totalVolume.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">All transactions</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Investments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                {buyTransactions.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Property purchases</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Rent Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                {rentTransactions.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">This month</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Avg. Transaction</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                €{Math.round(totalVolume / transactions.length).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Per transaction</p>
            </CardContent>
          </Card>
        </div>

        {/* Transactions Table */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-lg">
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>
              A complete record of all your property investments and rent earnings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table className="border-separate border-spacing-0">
                <TableHeader>
                  <TableRow className="border-b border-border/50">
                    <TableHead className="font-semibold text-foreground">Date</TableHead>
                    <TableHead className="font-semibold text-foreground">Property</TableHead>
                    <TableHead className="font-semibold text-foreground">Type</TableHead>
                    <TableHead className="font-semibold text-foreground">Tokens</TableHead>
                    <TableHead className="font-semibold text-foreground">Amount</TableHead>
                    <TableHead className="font-semibold text-foreground">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors duration-200">
                      <TableCell>
                        {new Date(transaction.date).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </TableCell>
                      <TableCell className="font-medium">
                        {transaction.property}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(transaction.type)}`}>
                          {transaction.type}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{transaction.tokens ? transaction.tokens : '-'}</span>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {transaction.amount}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(transaction.status) as any} className="font-medium">
                          {transaction.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}