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

  const cats = loadCatalog()

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Marketplace</h2>
          <p className="text-muted-foreground mt-2">Create listings to sell your property tokens or buy from others.</p>
        </div>

        {/* Create Listing */}
        <Card>
          <CardHeader>
            <CardTitle>Create Listing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <select className="border rounded px-3 py-2 bg-background" value={form.saleOrToken} onChange={(e) => setForm({ ...form, saleOrToken: e.target.value })}>
                <option value="">Select property token</option>
                {cats.map((c:any, i:number) => (
                  <option key={i} value={c.token}>{c.name} ({c.symbol})</option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                step={1}
                max={Math.max(1, maxAmount)}
                className="border rounded px-3 py-2 bg-background"
                placeholder={`Amount (owned: ${balance})`}
                value={form.amount}
                onChange={(e) => {
                  const v = e.target.value
                  const n = Math.max(0, parseInt(v || '0'))
                  const clamped = Math.min(n, maxAmount)
                  setForm({ ...form, amount: String(clamped) })
                }}
              />
              <input className="border rounded px-3 py-2 bg-background" placeholder="Price per token (USD)" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            </div>
            <div className="space-y-2">
              <input
                type="range"
                min={1}
                max={Math.max(1, maxAmount)}
                value={Math.min(Math.max(1, amountInt || 1), Math.max(1, maxAmount))}
                onChange={(e) => setForm({ ...form, amount: String(e.target.value) })}
              />
              <div className="text-xs text-muted-foreground flex justify-between">
                <span>Owned: {balance}</span>
                <span>Listing: {amountInt || 0}</span>
              </div>
            </div>
            <div>
              <Button className="gradient-emerald text-white border-0" disabled={!address || !form.saleOrToken || amountInt <= 0 || amountInt > maxAmount || !form.price} onClick={async () => {
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
        <Card>
          <CardHeader>
            <CardTitle>Active Listings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {listings.length === 0 && (<p className="text-sm text-muted-foreground">No listings yet.</p>)}
              {listings.map((l:any, i:number) => (
                <div key={i} className="p-4 border rounded-xl flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{l.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">{l.remaining} tokens</div>
                    <div className="text-xs text-muted-foreground">${(l.price6/1e6).toFixed?.(2) || (l.price6/1e6)}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={async () => {
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
                    }}>Buy 1</Button>
                    {address?.toLowerCase() === l.seller?.toLowerCase() && (
                      <Button variant="ghost" onClick={async () => {
                        try {
                          await writeContractAsync({ address: MARKETPLACE, abi: marketplaceAbi, functionName: 'cancel', args: [BigInt(l.id || 0)] })
                          const updated = listings.filter((_, idx:number) => idx !== i)
                          localStorage.setItem('rwa_market_listings', JSON.stringify(updated))
                          setListings(updated)
                        } catch {}
                      }}>Cancel</Button>
                    )}
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


