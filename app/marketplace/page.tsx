"use client"

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAccount, useWriteContract } from 'wagmi'
import { useEffect, useState } from 'react'
import { marketplaceAbi, erc20Abi } from '@/lib/abis'
import { publicClient } from '@/lib/publicClient'
import { useToast } from '@/hooks/use-toast'
import { rebuildMarketplaceListingsFromChain } from '@/lib/market'
import { parseEventLogs } from 'viem'

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
          const bal = await publicClient.readContract({ address: selected.token as `0x${string}`, abi: erc20Abi as any, functionName: 'balanceOf', args: [address] }) as any
          if (mounted) setBalance(Number(bal))
        } catch {}
      }
    }
    load(); return () => { mounted = false }
  }, [address, form.saleOrToken])

  // Load owned balances for all catalog tokens to filter dropdown to owned-only
  useEffect(() => {
    let mounted = true
    async function loadOwned() {
      const cats = loadCatalog()
      if (!address || cats.length === 0) { if (mounted) setOwnedMap({}); return }
      try {
        const entries = await Promise.all(cats.map(async (c:any) => {
          if (!c.token) return null
          try {
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
              </div>
            </div>
            
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

        {/* Listings */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50/50 to-blue-100/30 dark:from-blue-950/30 dark:to-blue-900/20 border-b border-blue-200/30 dark:border-blue-800/30">
            <CardTitle className="text-xl bg-gradient-to-r from-blue-700 to-blue-600 dark:from-blue-400 dark:to-blue-300 bg-clip-text text-transparent">Active Listings</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">Browse and purchase property tokens from other investors</p>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {listings.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center">
                    <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <p className="text-sm text-muted-foreground">No active listings yet. Be the first to create one!</p>
                </div>
              )}
              {listings.map((l:any, i:number) => (
                <div key={i} className="group p-6 border border-border/50 rounded-xl bg-gradient-to-r from-muted/10 to-muted/5 hover:from-muted/20 hover:to-muted/10 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900 dark:to-emerald-800 flex items-center justify-center">
                          <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h4M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <div>
                          <div className="font-semibold text-lg">{l.name}</div>
                          <div className="text-xs text-muted-foreground">Seller: {l.seller?.slice(0,6)}...{l.seller?.slice(-4)}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent">{l.remaining}</div>
                        <div className="text-xs text-muted-foreground">tokens available</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">${(l.price6/1e6).toFixed?.(2) || (l.price6/1e6)}</div>
                        <div className="text-xs text-muted-foreground">per token</div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          className="bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-950/50 dark:to-emerald-900/30 border-emerald-200 dark:border-emerald-800 hover:from-emerald-100 hover:to-emerald-200 dark:hover:from-emerald-900/70 dark:hover:to-emerald-800/50 transition-all duration-200 hover:scale-105"
                          onClick={async () => {
                            try {
                              const amount = BigInt(1)
                              const cost = BigInt(Math.round((l.price6) * 1))
                              await writeContractAsync({ address: USD, abi: erc20Abi, functionName: 'approve', args: [MARKETPLACE, cost] })
                              await writeContractAsync({ address: MARKETPLACE, abi: marketplaceAbi, functionName: 'buy', args: [BigInt(l.id || 0), amount] })
                              // Update local remaining
                              const updated = listings.map((x:any, idx:number) => idx === i ? { ...x, remaining: Math.max(0, x.remaining - 1) } : x).filter((x:any) => x.remaining > 0)
                              localStorage.setItem('rwa_market_listings', JSON.stringify(updated))
                              setListings(updated)
                            } catch {}
                          }}
                        >
                          Buy 1
                        </Button>
                        {address?.toLowerCase() === l.seller?.toLowerCase() && (
                          <Button 
                            variant="ghost" 
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-200"
                            onClick={async () => {
                              try {
                                await writeContractAsync({ address: MARKETPLACE, abi: marketplaceAbi, functionName: 'cancel', args: [BigInt(l.id || 0)] })
                                const updated = listings.filter((_, idx:number) => idx !== i)
                                localStorage.setItem('rwa_market_listings', JSON.stringify(updated))
                                setListings(updated)
                              } catch {}
                            }}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
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


