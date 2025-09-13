"use client"
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TrendingUp } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useWriteContract } from 'wagmi'
import { erc20Abi, propertySaleAbi } from '@/lib/abis'
import { createPublicClient, http } from 'viem'
import { sepolia } from 'viem/chains'

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
          {catalog.map((property, idx) => {
            const soldPercentage = 0
            
            return (
              <Card key={idx} className="overflow-hidden group hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-card/60 backdrop-blur-sm border-border/50 shadow-lg">
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={"https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg"}
                    alt={property.name || 'Property'}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute top-4 right-4 z-10">
                    <Badge variant="secondary" className="glass-effect text-white border-white/20 shadow-lg">
                      ERC20 Sale
                    </Badge>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                    <div className="text-white">
                      <p className="text-sm font-medium opacity-90">Investment Opportunity</p>
                      <p className="text-xs opacity-75">Click to view details</p>
                    </div>
                  </div>
                </div>
                
                <CardHeader className="pb-3">
                  <CardTitle className="text-xl">{property.name}</CardTitle>
                </CardHeader>
                
                <CardContent className="space-y-5">
                  <p className="text-sm text-muted-foreground">Token: {property.token || 'pending'}<br/>Sale: {property.sale || 'pending'}</p>
                  
                  <div className="flex justify-between items-center p-4 rounded-xl bg-gradient-to-r from-emerald-50/50 to-emerald-100/30 dark:from-emerald-950/30 dark:to-emerald-900/20 border border-emerald-200/30 dark:border-emerald-800/30">
                    <div>
                      <p className="text-sm text-muted-foreground">per token (USD)</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center text-emerald-600 dark:text-emerald-400">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        <span className="font-medium">New</span>
                      </div>
                      <p className="text-sm text-muted-foreground">primary sale</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span className="font-medium">- / 1000 tokens</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                      <div 
                        className="gradient-emerald rounded-full h-3 transition-all duration-500 shadow-sm"
                        style={{ width: `${soldPercentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground font-medium">Just listed</p>
                  </div>
                  
                  <Button className="w-full gradient-emerald hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 text-white border-0 hover:scale-[1.02]" size="lg"
                    onClick={async () => {
                      try {
                        if (!property.sale) return
                        const client = createPublicClient({ chain: sepolia, transport: http(process.env.NEXT_PUBLIC_RPC_URL) })
                        const price: bigint = await client.readContract({ address: property.sale as `0x${string}`, abi: propertySaleAbi as any, functionName: 'pricePerToken' }) as any
                        const usd = process.env.NEXT_PUBLIC_USD as `0x${string}`
                        await writeContractAsync({ address: usd, abi: erc20Abi, functionName: 'approve', args: [property.sale as `0x${string}`, price] })
                        await writeContractAsync({ address: property.sale as `0x${string}`, abi: propertySaleAbi, functionName: 'buy', args: [BigInt(1)] })
                      } catch (e) {
                        console.error(e)
                      }
                    }}
                  >
                    Approve + Buy 1
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </DashboardLayout>
  )
}