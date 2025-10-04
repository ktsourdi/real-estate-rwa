"use client"

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAccount, useWriteContract } from 'wagmi'
import { useEffect, useState } from 'react'
import { marketplaceAbi, erc20Abi, propertySaleAbi } from '@/lib/abis'
import { publicClient } from '@/lib/publicClient'
import { useToast } from '@/hooks/use-toast'
import { rebuildMarketplaceListingsFromChain, buildMarketData, type OrderBook, type TradeEvent } from '@/lib/market'
import { parseEventLogs } from 'viem'
import Image from 'next/image'

const MARKETPLACE = process.env.NEXT_PUBLIC_MARKETPLACE as `0x${string}`
const USD = process.env.NEXT_PUBLIC_USD as `0x${string}`

function loadCatalog() {
  if (typeof window === 'undefined') return [] as any[]
  try { return JSON.parse(localStorage.getItem('rwa_catalog') || '[]') } catch { return [] }
}

export default function MarketplacePage() {
  const { address } = useAccount()
  const { writeContractAsync } = useWriteContract()
  const { toast } = useToast()

  const [listings, setListings] = useState<any[]>([])
  const [form, setForm] = useState({ saleOrToken: '', amount: '1', price: '' })
  const [balance, setBalance] = useState<number>(0)
  const amountInt = Math.max(0, parseInt(form.amount || '0'))
  const maxAmount = Math.max(0, balance)
  const [ownedMap, setOwnedMap] = useState<Record<string, number>>({})
  const [suggested, setSuggested] = useState<number | null>(null)
  const computeApy = (seed?: string) => {
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
  const [previewImgSrc, setPreviewImgSrc] = useState<string>(fallbackImage)
  const [orderBook, setOrderBook] = useState<OrderBook | null>(null)
  const [trades, setTrades] = useState<TradeEvent[]>([])
  const [lastPrice6, setLastPrice6] = useState<number | null>(null)
  const [buyQty, setBuyQty] = useState<string>('')
  const [selectedAskId, setSelectedAskId] = useState<number | null>(null)
  const [range, setRange] = useState<'1H' | '1D' | '1W' | 'ALL'>('ALL')
  const [sellQty, setSellQty] = useState<string>('')
  const [sellPrice, setSellPrice] = useState<string>('')

  // Load listings from localStorage and chain (fallback)
  useEffect(() => {
    let mounted = true
    async function load() {
      const key = 'rwa_market_listings'
      const data = JSON.parse(localStorage.getItem(key) || '[]')
      // Chain fallback for active listings
      let chainListings: any[] = []
      try {
        const chain = await rebuildMarketplaceListingsFromChain()
        // try to attach display name from catalog
        const cats = loadCatalog()
        chainListings = chain.map((l: any) => ({
          ...l,
          name: cats.find((c: any) => c.token?.toLowerCase() === l.token?.toLowerCase())?.name || 'Property'
        }))
      } catch {}
      // merge, preferring chain (source of truth)
      const mergedMap = new Map<number, any>()
      for (const l of chainListings) mergedMap.set(Number(l.id), l)
      for (const l of data) {
        const idNum = Number(l.id || 0)
        if (!mergedMap.has(idNum) && Number(l.remaining) > 0) mergedMap.set(idNum, l)
        if (mergedMap.has(idNum)) {
          const curr = mergedMap.get(idNum)
          mergedMap.set(idNum, { ...curr, name: l.name || curr.name })
        }
      }
      const merged = Array.from(mergedMap.values())
      if (mounted) setListings(merged)
      // compute user's token balance for selected asset
      const cats = loadCatalog()
      const selected = cats.find((c:any) => c.token?.toLowerCase() === form.saleOrToken.toLowerCase())
      if (address && selected?.token) {
        try {
          if (selected?.sale) {
            const owned = await publicClient.readContract({ address: selected.sale as `0x${string}`, abi: propertySaleAbi as any, functionName: 'purchased', args: [address] }) as any
            if (mounted) setBalance(Number(owned))
          } else {
            const bal = await publicClient.readContract({ address: selected.token as `0x${string}`, abi: erc20Abi as any, functionName: 'balanceOf', args: [address] }) as any
            if (mounted) setBalance(Number(bal))
          }
        } catch { if (mounted) setBalance(0) }
      }
      // Suggested price from primary sale pricePerToken (USD 6dp)
      if (selected?.sale) {
        try {
          const p = await publicClient.readContract({ address: selected.sale as `0x${string}`, abi: propertySaleAbi as any, functionName: 'pricePerToken', args: [] }) as any
          if (mounted) setSuggested(Number(p) / 1e6)
        } catch { if (mounted) setSuggested(null) }
      } else {
        if (mounted) setSuggested(null)
      }
    }
    load(); return () => { mounted = false }
  }, [address, form.saleOrToken])

  // Load market data (order book + trades) for selected token
  useEffect(() => {
    let mounted = true
    async function loadMarket() {
      if (!form.saleOrToken) { if (mounted) { setOrderBook(null); setTrades([]); setLastPrice6(null) } ; return }
      try {
        const { orderBook, trades, lastPrice6 } = await buildMarketData(form.saleOrToken)
        if (!mounted) return
        setOrderBook(orderBook)
        setTrades(trades)
        setLastPrice6(lastPrice6)
        const bestAsk = orderBook.asks?.[0]
        setBuyQty(bestAsk ? '1' : '')
        setSelectedAskId(bestAsk?.id ?? null)
      } catch {
        if (mounted) { setOrderBook(null); setTrades([]); setLastPrice6(null) }
      }
    }
    loadMarket(); return () => { mounted = false }
  }, [form.saleOrToken])

  // Load owned amounts (from sale.purchased) for all catalog tokens to filter dropdown to owned-only
  useEffect(() => {
    let mounted = true
    async function loadOwned() {
      const cats = loadCatalog()
      if (!address || cats.length === 0) { if (mounted) setOwnedMap({}); return }
      try {
        const entries = await Promise.all(cats.map(async (c:any) => {
          if (!c.token) return null
          try {
            if (c.sale) {
              const owned = await publicClient.readContract({ address: c.sale as `0x${string}`, abi: propertySaleAbi as any, functionName: 'purchased', args: [address] }) as any
              return [String(c.token).toLowerCase(), Number(owned)] as [string, number]
            }
            const bal = await publicClient.readContract({ address: c.token as `0x${string}`, abi: erc20Abi as any, functionName: 'balanceOf', args: [address] }) as any
            return [String(c.token).toLowerCase(), Number(bal)] as [string, number]
          } catch { return [String(c.token).toLowerCase(), 0] as [string, number] }
        }))
        const map: Record<string, number> = {}
        for (const e of entries) { if (e && e[0]) map[e[0]] = e[1] }
        if (mounted) setOwnedMap(map)
      } catch { if (mounted) setOwnedMap({}) }
    }
    loadOwned(); return () => { mounted = false }
  }, [address])

  const cats = loadCatalog()

  // Update preview image when selection changes
  useEffect(() => {
    const meta = (cats || []).find((c:any) => String(c.token || '').toLowerCase() === String(form.saleOrToken || '').toLowerCase())
    setPreviewImgSrc(normalizeImageUrl(meta?.image))
  }, [form.saleOrToken])

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Marketplace</h2>
          <p className="text-muted-foreground mt-2">Create listings to sell your property tokens or buy from others.</p>
        </div>

        {/* Create Listing */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-emerald-50/50 to-emerald-100/30 dark:from-emerald-950/30 dark:to-emerald-900/20 border-b border-emerald-200/30 dark:border-emerald-800/30">
            <CardTitle className="text-xl bg-gradient-to-r from-emerald-700 to-emerald-600 dark:from-emerald-400 dark:to-emerald-300 bg-clip-text text-transparent">Create Listing</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">List your property tokens for sale on the marketplace</p>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <select className="w-full h-12 border-2 border-slate-200/50 dark:border-slate-700/50 rounded-lg px-4 bg-background/80 backdrop-blur-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-200" value={form.saleOrToken} onChange={(e) => setForm({ ...form, saleOrToken: e.target.value })}>
                  <option value="">Select property token</option>
                  {cats.filter((c:any) => ownedMap[String(c.token).toLowerCase()] > 0).map((c:any, i:number) => (
                    <option key={i} value={c.token}>{c.name} ({c.symbol})</option>
                  ))}
                </select>
                <div className="absolute -top-2 left-3 text-xs text-muted-foreground bg-background px-2 rounded">Property</div>
              </div>
              <div className="relative">
                <input
                  type="number"
                  min={1}
                  step={1}
                  max={Math.max(1, maxAmount)}
                  className="w-full h-12 border-2 border-slate-200/50 dark:border-slate-700/50 rounded-lg px-4 bg-background/80 backdrop-blur-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-200 text-center font-medium"
                  placeholder="0"
                  value={form.amount}
                  onChange={(e) => {
                    const v = e.target.value
                    const n = Math.max(0, parseInt(v || '0'))
                    const clamped = Math.min(n, maxAmount)
                    setForm({ ...form, amount: String(clamped) })
                  }}
                />
                <div className="absolute -top-2 left-3 text-xs text-muted-foreground bg-background px-2 rounded">Amount</div>
              </div>
              <div className="relative">
                <input 
                  className="w-full h-12 border-2 border-slate-200/50 dark:border-slate-700/50 rounded-lg px-4 bg-background/80 backdrop-blur-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-200 text-center font-medium" 
                  placeholder="0.00" 
                  value={form.price} 
                  onChange={(e) => setForm({ ...form, price: e.target.value })} 
                />
                <div className="absolute -top-2 left-3 text-xs text-muted-foreground bg-background px-2 rounded">Price per token (USD)</div>
                {suggested !== null && (
                  <div className="mt-2 text-xs text-muted-foreground flex items-center justify-between">
                    <span>Suggested: ${suggested.toFixed(2)}</span>
                    <button type="button" className="text-emerald-600 hover:underline" onClick={() => setForm({ ...form, price: suggested?.toFixed(2) || '' })}>Use suggested</button>
                  </div>
                )}
              </div>
            </div>

            {/* Selected property preview */}
            {(() => {
              const meta = (cats || []).find((c:any) => String(c.token || '').toLowerCase() === String(form.saleOrToken || '').toLowerCase())
              if (!meta) return null
              const apy = computeApy(meta.sale || meta.token)
              const owned = ownedMap[String(meta.token).toLowerCase()] || 0
              return (
                <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-br from-slate-50/50 to-slate-100/30 dark:from-slate-900/30 dark:to-slate-800/20 border border-slate-200/50 dark:border-slate-700/50">
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden">
                    <Image src={previewImgSrc} alt={meta.name || 'Property'} fill className="object-cover" onError={() => setPreviewImgSrc(fallbackImage)} />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">{meta.name}</div>
                    <div className="text-xs text-muted-foreground">{meta.location || ''}</div>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <div>Owned: <span className="font-medium">{owned}</span></div>
                    {suggested !== null && (<div>Primary: <span className="font-medium">${suggested.toFixed(2)}</span></div>)}
                    <div>APY: <span className="font-medium">{apy}%</span></div>
                  </div>
                </div>
              )
            })()}
            
            <div className="space-y-4 p-4 rounded-xl bg-gradient-to-br from-slate-50/50 to-slate-100/30 dark:from-slate-900/30 dark:to-slate-800/20 border border-slate-200/50 dark:border-slate-700/50">
              <div className="space-y-3">
                <div className="relative">
                  <input
                    type="range"
                    min={1}
                    max={Math.max(1, maxAmount)}
                    value={Math.min(Math.max(1, amountInt || 1), Math.max(1, maxAmount))}
                    onChange={(e) => setForm({ ...form, amount: String(e.target.value) })}
                    className="w-full h-2 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 rounded-lg appearance-none cursor-pointer slider-emerald"
                  />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground bg-slate-100/50 dark:bg-slate-800/50 px-3 py-2 rounded-lg">
                    Owned: <span className="font-semibold text-emerald-600 dark:text-emerald-400">{balance}</span>
                  </span>
                  <span className="text-muted-foreground bg-slate-100/50 dark:bg-slate-800/50 px-3 py-2 rounded-lg">
                    Listing: <span className="font-semibold text-emerald-600 dark:text-emerald-400">{amountInt || 0}</span>
                  </span>
                  {form.price && amountInt > 0 && (
                    <span className="text-muted-foreground bg-emerald-50/50 dark:bg-emerald-900/20 px-3 py-2 rounded-lg border border-emerald-200/50 dark:border-emerald-800/50">
                      Total: <span className="font-semibold text-emerald-600 dark:text-emerald-400">${((parseFloat(form.price) || 0) * amountInt).toFixed(2)}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div>
              <Button 
                className="w-full h-12 gradient-emerald hover:shadow-xl hover:shadow-emerald-500/25 transition-all duration-300 text-white border-0 hover:scale-[1.02] font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none" 
                disabled={!address || !form.saleOrToken || amountInt <= 0 || amountInt > maxAmount || !form.price} 
                onClick={async () => {
                try {
                  if (!address || !form.saleOrToken || !form.amount || !form.price) return
                  const amount = BigInt(parseInt(form.amount))
                  if (amount <= BigInt(0)) return
                  if (Number(amount) > maxAmount) { toast({ title: 'Invalid amount', description: 'Cannot list more than you own.', variant: 'destructive' }); return }
                  const price6 = BigInt(Math.round(Number(form.price) * 1e6))
                  if (Number(price6) <= 0) { toast({ title: 'Invalid price', description: 'Enter a positive price.', variant: 'destructive' }); return }
                  // Approve marketplace to transfer user's tokens
                  await writeContractAsync({ address: form.saleOrToken as `0x${string}`, abi: erc20Abi, functionName: 'approve', args: [MARKETPLACE, amount] })
                  const txHash = await writeContractAsync({ address: MARKETPLACE, abi: marketplaceAbi, functionName: 'createListing', args: [form.saleOrToken as `0x${string}`, amount, price6] })
                  toast({ title: 'Listing submitted', description: 'Waiting for confirmation…' })
                  // Wait for receipt and extract the emitted listing id
                  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash as `0x${string}` })
                  const decoded = parseEventLogs({ abi: marketplaceAbi as any, logs: receipt.logs as any, eventName: 'Listed' }) as any[]
                  const newId = Number(decoded?.[0]?.args?.id || 0)
                  // Store minimal listing locally for discovery/demo
                  const key = 'rwa_market_listings'
                  const existing = JSON.parse(localStorage.getItem(key) || '[]')
                  const tokenName = cats.find((c:any) => c.token?.toLowerCase() === form.saleOrToken.toLowerCase())?.name || 'Property'
                  existing.unshift({ id: newId, token: form.saleOrToken, remaining: Number(amount), price6: Number(price6), seller: address, name: tokenName })
                  localStorage.setItem(key, JSON.stringify(existing))
                  setListings(existing)
                } catch (e:any) {
                  toast({ title: 'Create failed', description: e?.message || 'Error', variant: 'destructive' })
                }
              }}>Create</Button>
            </div>
          </CardContent>
        </Card>

        {/* Market View: Order Book + Graph + Trade Panel */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50/50 to-blue-100/30 dark:from-blue-950/30 dark:to-blue-900/20 border-b border-blue-200/30 dark:border-blue-800/30">
            <CardTitle className="text-xl bg-gradient-to-r from-blue-700 to-blue-600 dark:from-blue-400 dark:to-blue-300 bg-clip-text text-transparent">Market</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">Live order book and recent trades</p>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Order Book */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">Best Bid / Ask</div>
                  <div className="text-lg font-semibold">
                    {(() => {
                      const bid = orderBook?.bids?.[0]?.price6
                      const ask = orderBook?.asks?.[0]?.price6
                      if (!bid && !ask && lastPrice6) return `$${(lastPrice6/1e6).toFixed(2)}`
                      return `${bid ? `$${(bid/1e6).toFixed(2)}` : '—'} / ${ask ? `$${(ask/1e6).toFixed(2)}` : '—'}`
                    })()}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-border/50">
                    <div className="px-3 py-2 text-xs text-muted-foreground">Asks</div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Price</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(orderBook?.asks || []).slice(0, 10).map((a: any, idx: number) => (
                          <TableRow key={idx} className={`cursor-pointer hover:bg-red-50/50 dark:hover:bg-red-950/10 ${selectedAskId === a.id ? 'bg-red-50/60 dark:bg-red-950/20' : ''}`} onClick={() => { setSelectedAskId(a.id); setBuyQty(String(Math.max(1, Math.min(a.amount, parseInt(buyQty||'1'))))); }}>
                            <TableCell className="text-red-600 dark:text-red-400">${(a.price6/1e6).toFixed(2)}</TableCell>
                            <TableCell>{a.amount}</TableCell>
                            <TableCell>${((a.price6/1e6) * a.amount).toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                        {(!orderBook?.asks || orderBook.asks.length === 0) && (
                          <TableRow><TableCell colSpan={3} className="text-muted-foreground">No asks</TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="rounded-xl border border-border/50">
                    <div className="px-3 py-2 text-xs text-muted-foreground">Bids</div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Price</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(orderBook?.bids || []).slice(0, 10).map((b: any, idx: number) => (
                          <TableRow key={idx} className="hover:bg-emerald-50/50 dark:hover:bg-emerald-950/10">
                            <TableCell className="text-emerald-600 dark:text-emerald-400">${(b.price6/1e6).toFixed(2)}</TableCell>
                            <TableCell>{b.amount}</TableCell>
                            <TableCell>${((b.price6/1e6) * b.amount).toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                        {(!orderBook?.bids || orderBook.bids.length === 0) && (
                          <TableRow>
                            <TableCell colSpan={3} className="text-muted-foreground">No bids (derived)</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Price history graph */}
                <div className="rounded-xl border border-border/50 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs text-muted-foreground">Price history</div>
                    <div className="flex gap-1">
                      {(['1H','1D','1W','ALL'] as const).map(r => (
                        <Button key={r} size="sm" variant={range===r?'default':'outline'} onClick={()=> setRange(r)}>{r}</Button>
                      ))}
                    </div>
                  </div>
                  <ChartContainer config={{ price: { label: 'USD', color: 'hsl(160, 84%, 39%)' } }} className="h-64 w-full">
                    <AreaChart data={(trades || []).filter((t: any) => t.timestamp).filter((t: any) => {
                      if (range === 'ALL') return true
                      const now = Math.floor(Date.now()/1000)
                      const cutoff = range === '1H' ? now-3600 : range === '1D' ? now-86400 : now-604800
                      return (t.timestamp||0) >= cutoff
                    }).sort((a: any,b: any)=> (a.timestamp||0)-(b.timestamp||0)).map((t: any) => ({
                      time: new Date((t.timestamp||0) * 1000).toLocaleTimeString(),
                      price: Number((t.price6/1e6).toFixed(2)),
                    }))}>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis dataKey="time" tickLine={false} axisLine={false} minTickGap={24} />
                      <YAxis tickLine={false} axisLine={false} width={40} domain={['dataMin', 'dataMax']} />
                      <Area dataKey="price" type="monotone" stroke="var(--color-price)" fill="var(--color-price)" fillOpacity={0.15} />
                      <ChartTooltip cursor={true} content={<ChartTooltipContent nameKey="price" />} />
                    </AreaChart>
                  </ChartContainer>
                </div>
              </div>

              {/* Trade panel */}
              <div className="space-y-4">
                <Tabs defaultValue="buy">
                  <TabsList className="w-full">
                    <TabsTrigger className="flex-1" value="buy">Buy</TabsTrigger>
                    <TabsTrigger className="flex-1" value="sell">Sell</TabsTrigger>
                  </TabsList>
                  <TabsContent value="buy">
                    <div className="rounded-xl border border-border/50 p-4">
                      {(() => {
                        const selected = orderBook?.asks?.find((a: any) => a.id === selectedAskId) || orderBook?.asks?.[0]
                        if (!selected) return <div className="text-sm text-muted-foreground">No liquidity available</div>
                        const qty = Math.max(0, parseInt(buyQty || '0'))
                        const clamped = Math.min(qty, selected.amount || 0)
                        const total = (selected.price6/1e6) * (clamped || 0)
                        return (
                          <div className="space-y-3">
                            <div className="text-xs text-muted-foreground">Selected: <span className="font-medium text-foreground">${(selected.price6/1e6).toFixed(2)}</span> • Available: <span className="font-medium">{selected.amount}</span></div>
                            <input className="w-full h-11 rounded-lg border border-border/60 px-3 bg-background/80" placeholder="Amount" value={buyQty} onChange={(e)=> setBuyQty(e.target.value)} type="number" min={1} />
                            <div className="flex items-center gap-2">
                              {[1,10,100].map(n => (
                                <Button key={n} type="button" variant="outline" size="sm" onClick={()=> setBuyQty(String(Math.min((parseInt(buyQty||'0')||0)+n, selected.amount)))}>+{n}</Button>
                              ))}
                              <Button type="button" variant="outline" size="sm" onClick={()=> setBuyQty(String(selected.amount))}>Max</Button>
                            </div>
                            <div className="text-sm text-muted-foreground">Total: <span className="font-medium text-foreground">${total.toFixed(2)}</span></div>
                            <Button className="w-full h-11" disabled={!address || clamped <= 0} onClick={async ()=>{
                              try {
                                if (!address) return
                                const amount = BigInt(clamped)
                                const cost = BigInt(Math.round(selected.price6 * clamped))
                                await writeContractAsync({ address: USD, abi: erc20Abi, functionName: 'approve', args: [MARKETPLACE, cost] })
                                await writeContractAsync({ address: MARKETPLACE, abi: marketplaceAbi, functionName: 'buy', args: [BigInt(selected.id), amount] })
                                setBuyQty('')
                                toast({ title: 'Trade submitted', description: 'Waiting for confirmation…' })
                              } catch (e:any) {
                                toast({ title: 'Trade failed', description: e?.message || 'Error', variant: 'destructive' })
                              }
                            }}>Trade</Button>
                          </div>
                        )
                      })()}
                    </div>
                  </TabsContent>
                  <TabsContent value="sell">
                    <div className="rounded-xl border border-border/50 p-4 space-y-3">
                      <div className="text-xs text-muted-foreground">Sell tokens by creating a listing at your price</div>
                      <input className="w-full h-11 rounded-lg border border-border/60 px-3 bg-background/80" placeholder="Amount" value={sellQty} onChange={(e)=> setSellQty(e.target.value)} type="number" min={1} />
                      <input className="w-full h-11 rounded-lg border border-border/60 px-3 bg-background/80" placeholder="Price per token (USD)" value={sellPrice} onChange={(e)=> setSellPrice(e.target.value)} type="number" min={0} step={0.01} />
                      <Button className="w-full h-11" disabled={!address || !form.saleOrToken || (parseInt(sellQty||'0')<=0) || (parseFloat(sellPrice||'0')<=0)} onClick={async ()=>{
                        try {
                          if (!address || !form.saleOrToken) return
                          const amount = BigInt(Math.max(0, parseInt(sellQty||'0')))
                          if (amount <= BigInt(0)) return
                          const price6 = BigInt(Math.round((parseFloat(sellPrice||'0')||0) * 1e6))
                          await writeContractAsync({ address: form.saleOrToken as `0x${string}`, abi: erc20Abi, functionName: 'approve', args: [MARKETPLACE, amount] })
                          await writeContractAsync({ address: MARKETPLACE, abi: marketplaceAbi, functionName: 'createListing', args: [form.saleOrToken as `0x${string}`, amount, price6] })
                          setSellQty(''); setSellPrice('')
                          toast({ title: 'Listing submitted', description: 'Waiting for confirmation…' })
                        } catch (e:any) {
                          toast({ title: 'Sell failed', description: e?.message || 'Error', variant: 'destructive' })
                        }
                      }}>List</Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}


