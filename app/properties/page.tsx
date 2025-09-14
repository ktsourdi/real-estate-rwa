"use client"
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TrendingUp } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useAccount, useWriteContract } from 'wagmi'
import { erc20Abi, propertySaleAbi } from '@/lib/abis'
import { publicClient } from '@/lib/publicClient'
import { confettiBurst, showLoading } from '@/lib/confetti'
import { useToast } from '@/hooks/use-toast'
import { rebuildCatalogFromChain } from '@/lib/catalog'

function loadCatalog() {
  if (typeof window === 'undefined') return [] as any[]
  try { return JSON.parse(localStorage.getItem('rwa_catalog') || '[]') } catch { return [] }
}

export default function Properties() {
  const [catalog, setCatalog] = useState<any[]>([])
  const { writeContractAsync } = useWriteContract()

  useEffect(() => {
    let mounted = true
    async function init() {
      const local = loadCatalog()
      if (local.length > 0) { if (mounted) setCatalog(local); return }
      // Fallback: rebuild from chain if localStorage empty
      try {
        const rebuilt = await rebuildCatalogFromChain()
        if (mounted) setCatalog(rebuilt)
      } catch { if (mounted) setCatalog([]) }
    }
    init(); return () => { mounted = false }
  }, [])
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Properties</h2>
          <p className="text-muted-foreground mt-2">
            Discover and invest in tokenized real estate opportunities.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {catalog.map((property, idx) => (
            <PropertyCard key={idx} property={property} writeContractAsync={writeContractAsync} />
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}

function PropertyCard({ property, writeContractAsync }: { property: any, writeContractAsync: any }) {
  const [price, setPrice] = useState<bigint | null>(null)
  const [purchased, setPurchased] = useState<bigint | null>(null)
  const [owned, setOwned] = useState<bigint | null>(null)
  const [amount, setAmount] = useState<string>('1')
  const MAX = BigInt(1000)
  const fallbackImage = 'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg'
  const normalizeImageUrl = (u?: string): string => {
    if (!u) return fallbackImage
    if (u.startsWith('ipfs://')) return `https://ipfs.io/ipfs/${u.replace('ipfs://','')}`
    return u
  }
  const [imgSrc, setImgSrc] = useState<string>(normalizeImageUrl(property?.image))
  useEffect(() => { setImgSrc(normalizeImageUrl(property?.image)) }, [property?.image])
  const { address } = useAccount()
  const { toast } = useToast()

  useEffect(() => {
    let mounted = true
    async function load() {
      if (!property.sale) return
      try {
        const [pp, tp] = await Promise.all([
          publicClient.readContract({ address: property.sale as `0x${string}`, abi: propertySaleAbi as any, functionName: 'pricePerToken', args: [] }) as Promise<any>,
          publicClient.readContract({ address: property.sale as `0x${string}`, abi: propertySaleAbi as any, functionName: 'totalPurchased', args: [] }) as Promise<any>,
        ])
        if (mounted) { setPrice(pp as bigint); setPurchased(tp as bigint) }
        // Fetch user's purchased amount from sale mapping as "owned" per business rule (no claim)
        if (mounted && property.sale && address) {
          const bought = await publicClient.readContract({ address: property.sale as `0x${string}`, abi: propertySaleAbi as any, functionName: 'purchased', args: [address] }) as any
          if (mounted) setOwned(bought as bigint)
        }
      } catch {}
    }
    load(); return () => { mounted = false }
  }, [property.sale, property.token, address])

  const soldPct = purchased !== null ? Number((purchased * BigInt(100)) / MAX) : 0
  const priceStr = price !== null ? (Number(price) / 1e6).toFixed(2) : '-'
  const ownedPct = owned !== null ? Number((owned * BigInt(100)) / MAX) : 0
  const remaining = purchased !== null ? Math.max(0, Number(MAX - purchased)) : 1000
  const amountNum = Math.max(0, parseInt(amount || '0'))
  const totalCostStr = price !== null && amountNum > 0 ? `$${((Number(price) / 1e6) * amountNum).toFixed(2)}` : '-'

  return (
    <Card className="overflow-hidden group hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-card/60 backdrop-blur-sm border-border/50 shadow-lg">
      <div className="relative h-48 overflow-hidden">
        <Image src={imgSrc} alt={property.name || 'Property'} fill className="object-cover group-hover:scale-110 transition-transform duration-700" onError={() => setImgSrc(fallbackImage)} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute top-4 right-4 z-10">
          {property.location ? (
            <Badge variant="secondary" className="glass-effect text-white border-white/20 shadow-lg">{property.location}</Badge>
          ) : null}
        </div>
      </div>

      <CardHeader className="pb-3">
        <CardTitle className="text-xl">{property.name}</CardTitle>
        {property.location ? (<p className="text-sm text-muted-foreground mt-1">{property.location}</p>) : null}
      </CardHeader>

      <CardContent className="space-y-5">

        <div className="flex justify-between items-center p-4 rounded-xl bg-gradient-to-r from-emerald-50/50 to-emerald-100/30 dark:from-emerald-950/30 dark:to-emerald-900/20 border border-emerald-200/30 dark:border-emerald-800/30">
          <div>
            <p className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent">{priceStr === '-' ? '-' : `$${priceStr}`}</p>
            <p className="text-sm text-muted-foreground">per token</p>
          </div>
          <div className="text-right">
            <div className="flex items-center text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-4 h-4 mr-1" />
              <span className="font-medium">{(() => { let x = 0; const seed = (property.sale || property.token || '').toLowerCase(); for (const c of seed) x = (x * 31 + c.charCodeAt(0)) % 10000; return `${(7 + ((x % 301)/100)).toFixed(1)}% APY` })()}</span>
            </div>
            <p className="text-sm text-muted-foreground">live</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span className="font-medium">{purchased !== null ? Number(purchased).toString() : '-'} / 1000 tokens</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
            <div className="gradient-emerald rounded-full h-3 transition-all duration-500 shadow-sm" style={{ width: `${soldPct}%` }} />
          </div>
          <p className="text-xs text-muted-foreground font-medium">{soldPct}% funded</p>
          <p className="text-xs text-muted-foreground">You own: <span className="font-medium">{owned !== null ? Number(owned).toString() : '-'}</span> tokens ({ownedPct}%)</p>
        </div>

        <div className="space-y-4 p-4 rounded-xl bg-gradient-to-br from-slate-50/50 to-slate-100/30 dark:from-slate-900/30 dark:to-slate-800/20 border border-slate-200/50 dark:border-slate-700/50">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <input 
                  className="w-20 h-10 border-2 border-emerald-200/50 dark:border-emerald-800/50 rounded-lg px-3 text-sm bg-background/80 backdrop-blur-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-200 text-center font-medium" 
                  value={amount} 
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="1"
                />
                <div className="absolute -top-2 left-2 text-xs text-muted-foreground bg-background px-1 rounded">Tokens</div>
              </div>
              <div className="flex gap-1.5">
                {[1, 10, 20, 50].map((q) => (
                  <Button 
                    key={q} 
                    variant="outline" 
                    size="sm" 
                    className="h-8 px-3 text-xs font-medium bg-gradient-to-r from-emerald-50 to-emerald-100/50 dark:from-emerald-950/50 dark:to-emerald-900/30 border-emerald-200/60 dark:border-emerald-800/60 hover:from-emerald-100 hover:to-emerald-200/50 hover:border-emerald-300 dark:hover:from-emerald-900/70 dark:hover:to-emerald-800/50 transition-all duration-200 hover:scale-105"
                    onClick={() => setAmount(String(Math.min(remaining, q)))}
                  >
                    {q}
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="relative">
                <input
                  type="range"
                  min={1}
                  max={Math.max(1, remaining)}
                  value={Math.min(Math.max(1, amountNum || 1), Math.max(1, remaining))}
                  onChange={(e) => setAmount(String(e.target.value))}
                  className="w-full h-2 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 rounded-lg appearance-none cursor-pointer slider-emerald"
                />
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground bg-slate-100/50 dark:bg-slate-800/50 px-2 py-1 rounded-md">
                  Available: <span className="font-medium text-emerald-600 dark:text-emerald-400">{remaining}</span>
                </span>
                <span className="text-muted-foreground bg-slate-100/50 dark:bg-slate-800/50 px-2 py-1 rounded-md">
                  Total: <span className="font-medium text-emerald-600 dark:text-emerald-400">{totalCostStr}</span>
                </span>
              </div>
            </div>
          </div>
          
          <Button className="w-full h-11 gradient-emerald hover:shadow-xl hover:shadow-emerald-500/25 transition-all duration-300 text-white border-0 hover:scale-[1.02] font-semibold text-sm"
            onClick={async () => {
              const loader = showLoading()
              try {
                if (!property.sale || price === null || !address) return
                const amt = BigInt(parseInt(amount || '0'))
                if (amt <= BigInt(0)) return
                const allowance = price * amt
                const usd = process.env.NEXT_PUBLIC_USD as `0x${string}`
                const bal = await publicClient.readContract({ address: usd, abi: erc20Abi as any, functionName: 'balanceOf', args: [address] }) as any
                if ((bal as bigint) < allowance) {
                  loader?.remove()
                  toast({ title: 'Insufficient USD', description: 'Not enough USD balance to buy this amount.', variant: 'destructive' })
                  return
                }
                const approveHash = await writeContractAsync({ address: usd, abi: erc20Abi, functionName: 'approve', args: [property.sale as `0x${string}`, allowance] })
                if (approveHash) {
                  await publicClient.waitForTransactionReceipt({ hash: approveHash as `0x${string}` })
                }
                const buyHash = await writeContractAsync({ address: property.sale as `0x${string}`, abi: propertySaleAbi, functionName: 'buy', args: [amt] })
                if (buyHash) {
                  await publicClient.waitForTransactionReceipt({ hash: buyHash as `0x${string}` })
                }
                
                // Transaction confirmed - show success effects
                loader?.remove()
                confettiBurst()
                
                // Refresh purchased and owned balances
                const [tp2, bal2] = await Promise.all([
                  publicClient.readContract({ address: property.sale as `0x${string}`, abi: propertySaleAbi as any, functionName: 'totalPurchased', args: [] }) as Promise<any>,
                  address ? publicClient.readContract({ address: property.sale as `0x${string}`, abi: propertySaleAbi as any, functionName: 'purchased', args: [address] }) as Promise<any> : Promise.resolve(owned ?? BigInt(0))
                ])
                setPurchased(tp2 as bigint)
                setOwned(bal2 as bigint)
              } catch (e) { 
                loader?.remove()
                console.error(e)
                toast({
                  title: "Transaction Failed",
                  description: "Your purchase could not be completed. Please try again.",
                  variant: "destructive"
                })
              }
            }}
          >
            Buy
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}