"use client"

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import { publicClient } from '@/lib/publicClient'
import { decodeEventLog } from 'viem'
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
              const parsed = decodeEventLog({ abi: propertySaleAbi as any, data: log.data, topics: log.topics }) as any
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