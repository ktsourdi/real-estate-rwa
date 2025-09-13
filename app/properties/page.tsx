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

function loadCatalog() {
  if (typeof window === 'undefined') return [] as any[]
  try { return JSON.parse(localStorage.getItem('rwa_catalog') || '[]') } catch { return [] }
}

export default function Properties() {
  const [catalog, setCatalog] = useState<any[]>([])
  const { writeContractAsync } = useWriteContract()

  useEffect(() => { setCatalog(loadCatalog()) }, [])
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
  const [amount, setAmount] = useState<string>('1')
  const MAX = BigInt(1000)
  const image = 'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg'
  const { address } = useAccount()
  const { toast } = useToast()

  useEffect(() => {
    let mounted = true
    async function load() {
      if (!property.sale) return
      try {
        const [pp, tp] = await Promise.all([
          publicClient.readContract({ address: property.sale as `0x${string}`, abi: propertySaleAbi as any, functionName: 'pricePerToken' }) as Promise<any>,
          publicClient.readContract({ address: property.sale as `0x${string}`, abi: propertySaleAbi as any, functionName: 'totalPurchased' }) as Promise<any>,
        ])
        if (mounted) { setPrice(pp as bigint); setPurchased(tp as bigint) }
        // Claim disabled by business rules; do not fetch token balance
      } catch {}
    }
    load(); return () => { mounted = false }
  }, [property.sale, property.token, address])

  const soldPct = purchased !== null ? Number((purchased * 100n) / MAX) : 0
  const priceStr = price !== null ? (Number(price) / 1e6).toFixed(2) : '-'

  return (
    <Card className="overflow-hidden group hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-card/60 backdrop-blur-sm border-border/50 shadow-lg">
      <div className="relative h-48 overflow-hidden">
        <Image src={image} alt={property.name || 'Property'} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute top-4 right-4 z-10">
          <Badge variant="secondary" className="glass-effect text-white border-white/20 shadow-lg">ERC20 Sale</Badge>
        </div>
      </div>

      <CardHeader className="pb-3">
        <CardTitle className="text-xl">{property.name}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-5">
        <p className="text-sm text-muted-foreground">Token: {property.token || 'pending'}<br/>Sale: {property.sale || 'pending'}</p>

        <div className="flex justify-between items-center p-4 rounded-xl bg-gradient-to-r from-emerald-50/50 to-emerald-100/30 dark:from-emerald-950/30 dark:to-emerald-900/20 border border-emerald-200/30 dark:border-emerald-800/30">
          <div>
            <p className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent">{priceStr === '-' ? '-' : `$${priceStr}`}</p>
            <p className="text-sm text-muted-foreground">per token</p>
          </div>
          <div className="text-right">
            <div className="flex items-center text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-4 h-4 mr-1" />
              <span className="font-medium">Primary</span>
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
        </div>

        <div className="flex gap-2">
          <input className="w-24 border rounded px-3 py-2 text-sm bg-background" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <Button className="flex-1 gradient-emerald hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 text-white border-0 hover:scale-[1.02]"
            onClick={async () => {
              const loader = showLoading()
              try {
                if (!property.sale || price === null || !address) return
                const amt = BigInt(parseInt(amount || '0'))
                if (amt <= 0n) return
                const allowance = price * amt
                const usd = process.env.NEXT_PUBLIC_USD as `0x${string}`
                const bal = await publicClient.readContract({ address: usd, abi: erc20Abi as any, functionName: 'balanceOf', args: [address] }) as any
                if ((bal as bigint) < allowance) {
                  loader?.remove()
                  toast({ title: 'Insufficient USD', description: 'Not enough USD balance to buy this amount.', variant: 'destructive' })
                  return
                }
                await writeContractAsync({ address: usd, abi: erc20Abi, functionName: 'approve', args: [property.sale as `0x${string}`, allowance] })
                await writeContractAsync({ address: property.sale as `0x${string}`, abi: propertySaleAbi, functionName: 'buy', args: [amt] })
                
                // Transaction confirmed - show success effects
                loader?.remove()
                confettiBurst()
                
                // refresh purchased
                const tp = await publicClient.readContract({ address: property.sale as `0x${string}`, abi: propertySaleAbi as any, functionName: 'totalPurchased' }) as any
                setPurchased(tp as bigint)
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
            Approve + Buy
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}