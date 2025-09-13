'use client'

import { useState } from 'react'
import { useAccount, useWriteContract } from 'wagmi'
import { realEstateDeedAbi, fractionFactoryAbi } from '@/lib/abis'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { uploadPropertyMetadata } from '@/lib/ipfs'
import { useToast } from '@/hooks/use-toast'

const ADMIN = process.env.NEXT_PUBLIC_ADMIN_ADDRESS?.toLowerCase()
const DEED = process.env.NEXT_PUBLIC_DEED as `0x${string}`
const FACTORY = process.env.NEXT_PUBLIC_FACTORY as `0x${string}`

export default function AdminPage() {
  const { address } = useAccount()
  const isAdmin = address && ADMIN && address.toLowerCase() === ADMIN

  const [mintForm, setMintForm] = useState({ tokenId: '', tokenURI: '' })
  const [metaForm, setMetaForm] = useState({ title: '', description: '', location: '' })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [offerForm, setOfferForm] = useState({ deedId: '', totalPrice: '' })

  const { writeContractAsync: writeDeed, isPending: minting } = useWriteContract()
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
            <CardTitle>Mint Deed</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Title</Label>
                <Input value={metaForm.title} onChange={(e) => setMetaForm({ ...metaForm, title: e.target.value })} />
              </div>
              <div>
                <Label>Location</Label>
                <Input value={metaForm.location} onChange={(e) => setMetaForm({ ...metaForm, location: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Input value={metaForm.description} onChange={(e) => setMetaForm({ ...metaForm, description: e.target.value })} />
            </div>
            <div>
              <Label>Image</Label>
              <Input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
            </div>
            <div>
              <Label>Token ID</Label>
              <Input value={mintForm.tokenId} onChange={(e) => setMintForm({ ...mintForm, tokenId: e.target.value })} placeholder="1" />
            </div>
            <Button disabled={minting || !address} onClick={async () => {
              // Upload metadata to IPFS if not provided
              let tokenURI = mintForm.tokenURI
              if (!tokenURI) {
                tokenURI = await uploadPropertyMetadata({
                  title: metaForm.title,
                  description: metaForm.description,
                  location: metaForm.location,
                  imageFile: imageFile as any,
                })
              }

              try {
                const hash = await writeDeed({
                  address: DEED,
                  abi: realEstateDeedAbi,
                  functionName: 'mint',
                  args: [address as `0x${string}`, BigInt(mintForm.tokenId || '0'), tokenURI],
                })
                toast({ title: 'Mint submitted', description: `Tx: ${String(hash).slice(0,10)}…` })
                // Prefill offering Deed ID with the minted tokenId for convenience
                setOfferForm((prev) => ({ ...prev, deedId: mintForm.tokenId || prev.deedId }))
              } catch (e: any) {
                toast({ title: 'Mint failed', description: e?.message || 'Error', variant: 'destructive' })
              }
            }}>Mint</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Create Offering (fixed 1000 fractions)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Deed ID</Label>
              <Input value={offerForm.deedId} onChange={(e) => setOfferForm({ ...offerForm, deedId: e.target.value })} placeholder="1" />
              <p className="text-xs text-muted-foreground mt-1">Deed ID equals the Token ID you minted above. It auto-fills after a successful mint.</p>
            </div>
            <div>
              <Label>Total Price (USD, 6 decimals)</Label>
              <Input value={offerForm.totalPrice} onChange={(e) => setOfferForm({ ...offerForm, totalPrice: e.target.value })} placeholder="25000000000" />
              <p className="text-xs text-muted-foreground mt-1">Price is for the whole property; 1000 fractions are created, price per fraction = total/1000.</p>
            </div>
            <Button disabled={creating} onClick={async () => {
              try {
                const total = BigInt(offerForm.totalPrice || '0')
                const max = 1000n
                const pricePerFraction = total / max
                const remainder = total % max
                const softCap = max // all-or-nothing
                const deadline = BigInt(Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60) // +7 days

                if (remainder !== 0n) {
                  toast({ title: 'Note', description: 'Total price not divisible by 1000; rounding down per-fraction price.', variant: 'secondary' })
                }

                const defaultName = metaForm.title ? `${metaForm.title} Shares` : `Property #${offerForm.deedId} Shares`
                const defaultSymbol = metaForm.title ? metaForm.title.replace(/\s+/g, '').slice(0,4).toUpperCase() + 'SH' : `P${offerForm.deedId}`

                const hash = await writeFactory({
                  address: FACTORY,
                  abi: fractionFactoryAbi,
                  functionName: 'createOffering',
                  args: [
                    DEED,
                    BigInt(offerForm.deedId || '0'),
                    defaultName,
                    defaultSymbol,
                    pricePerFraction,
                    max,
                    softCap,
                    deadline,
                  ],
                })
                toast({ title: 'Offering submitted', description: `Tx: ${String(hash).slice(0,10)}…` })
              } catch (e: any) {
                toast({ title: 'Create failed', description: e?.message || 'Error', variant: 'destructive' })
              }
            }}>Create</Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}


