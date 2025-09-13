'use client'

import { useState } from 'react'
import { useAccount, useWriteContract } from 'wagmi'
import { parseUnits } from 'viem'
import { propertyFactoryAbi } from '@/lib/abis'
import { useEffect } from 'react'
import { createPublicClient, http, parseEventLogs } from 'viem'
import { sepolia } from 'viem/chains'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { uploadPropertyMetadata } from '@/lib/ipfs'
import { useToast } from '@/hooks/use-toast'

const ADMIN = process.env.NEXT_PUBLIC_ADMIN_ADDRESS?.toLowerCase()
const FACTORY = process.env.NEXT_PUBLIC_PROPERTY_FACTORY as `0x${string}`

export default function AdminPage() {
  const { address } = useAccount()
  const isAdmin = address && ADMIN && address.toLowerCase() === ADMIN

  const [mintForm, setMintForm] = useState({ tokenId: '', tokenURI: '' })
  const [metaForm, setMetaForm] = useState({ title: '', description: '', location: '' })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [offerForm, setOfferForm] = useState({ totalPrice: '', symbol: '' })

  const { writeContractAsync: writeFactory, isPending: creating } = useWriteContract()
  const { toast } = useToast()

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="text-sm text-muted-foreground">Connect with the admin wallet to access this page.</div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Create Property Sale (ERC-20, 1000 supply)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Title</Label>
                <Input value={metaForm.title} onChange={(e) => setMetaForm({ ...metaForm, title: e.target.value })} />
              </div>
              <div>
                <Label>Symbol</Label>
                <Input value={offerForm.symbol} onChange={(e) => setOfferForm({ ...offerForm, symbol: e.target.value.toUpperCase().slice(0,6) })} placeholder="PROP" />
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Input value={metaForm.description} onChange={(e) => setMetaForm({ ...metaForm, description: e.target.value })} />
            </div>
            <div>
              <Label>Location</Label>
              <Input value={metaForm.location} onChange={(e) => setMetaForm({ ...metaForm, location: e.target.value })} />
            </div>
            <div>
              <Label>Image</Label>
              <Input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
            </div>
            <div>
              <Label>Total Price (USD)</Label>
              <Input value={offerForm.totalPrice} onChange={(e) => setOfferForm({ ...offerForm, totalPrice: e.target.value })} placeholder="e.g. 250000.00" />
              <p className="text-xs text-muted-foreground mt-1">Human-friendly (e.g., 250000.00). We convert to 6‑decimals on-chain and divide by 1000.</p>
            </div>
            <Button disabled={creating || !address} onClick={async () => {
              try {
                const meta = await uploadPropertyMetadata({
                  title: metaForm.title,
                  description: metaForm.description,
                  location: metaForm.location,
                  imageFile: imageFile as any,
                })

                if (!offerForm.totalPrice || Number.isNaN(Number(offerForm.totalPrice))) {
                  toast({ title: 'Invalid total price', description: 'Enter a numeric USD amount (e.g., 250000.00).', variant: 'destructive' })
                  return
                }
                const total = parseUnits(String(offerForm.totalPrice), 6)
                const name = metaForm.title?.length ? `${metaForm.title} Shares` : 'Property Shares'
                const symbol = offerForm.symbol?.length ? offerForm.symbol : 'PROP'

                const hash = await writeFactory({
                  address: FACTORY,
                  abi: propertyFactoryAbi,
                  functionName: 'createSale',
                  args: [name, symbol, total],
                })
                toast({ title: 'Sale submitted', description: `Tx: ${String(hash).slice(0,10)}… waiting…` })

                // Wait for receipt and decode event to get token & sale addresses
                const client = createPublicClient({ chain: sepolia, transport: http(process.env.NEXT_PUBLIC_RPC_URL) })
                const receipt = await client.waitForTransactionReceipt({ hash: hash as `0x${string}` })
                const decoded = parseEventLogs({ abi: propertyFactoryAbi as any, logs: receipt.logs as any, eventName: 'SaleCreated' }) as any[]
                const tokenAddr = decoded?.[0]?.args?.token as string | undefined
                const saleAddr = decoded?.[0]?.args?.sale as string | undefined

                const catalogKey = 'rwa_catalog'
                const existing = JSON.parse(localStorage.getItem(catalogKey) || '[]')
                const item = { name, symbol, totalPrice: String(offerForm.totalPrice), token: tokenAddr || null, sale: saleAddr || null, image: meta.imageURI || null, location: metaForm.location }
                localStorage.setItem(catalogKey, JSON.stringify([item, ...existing]))
                toast({ title: 'Sale created', description: `Token: ${tokenAddr?.slice(0,6)}… Sale: ${saleAddr?.slice(0,6)}…` })
              } catch (e: any) {
                toast({ title: 'Create failed', description: e?.message || 'Error', variant: 'destructive' })
              }
            }}>Create Sale</Button>
          </CardContent>
        </Card>

        {/* Second column intentionally left for future controls (settle, list sales) */}
      </div>
    </DashboardLayout>
  )
}


