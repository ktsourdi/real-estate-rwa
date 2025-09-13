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
  const [offerForm, setOfferForm] = useState({
    deedId: '', name: '', symbol: '', price: '', max: '', softCap: '', deadline: ''
  })

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
              } catch (e: any) {
                toast({ title: 'Mint failed', description: e?.message || 'Error', variant: 'destructive' })
              }
            }}>Mint</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Create Offering</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Deed ID</Label>
              <Input value={offerForm.deedId} onChange={(e) => setOfferForm({ ...offerForm, deedId: e.target.value })} placeholder="1" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Name</Label>
                <Input value={offerForm.name} onChange={(e) => setOfferForm({ ...offerForm, name: e.target.value })} />
              </div>
              <div>
                <Label>Symbol</Label>
                <Input value={offerForm.symbol} onChange={(e) => setOfferForm({ ...offerForm, symbol: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Price per Fraction (6 decimals)</Label>
                <Input value={offerForm.price} onChange={(e) => setOfferForm({ ...offerForm, price: e.target.value })} placeholder="25000000" />
              </div>
              <div>
                <Label>Max Fractions</Label>
                <Input value={offerForm.max} onChange={(e) => setOfferForm({ ...offerForm, max: e.target.value })} placeholder="1000000" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Soft Cap Fractions</Label>
                <Input value={offerForm.softCap} onChange={(e) => setOfferForm({ ...offerForm, softCap: e.target.value })} placeholder="600000" />
              </div>
              <div>
                <Label>Deadline (unix)</Label>
                <Input value={offerForm.deadline} onChange={(e) => setOfferForm({ ...offerForm, deadline: e.target.value })} placeholder="$(date +%s)+..." />
              </div>
            </div>
            <Button disabled={creating} onClick={async () => {
              await writeFactory({
                address: FACTORY,
                abi: fractionFactoryAbi,
                functionName: 'createOffering',
                args: [
                  DEED,
                  BigInt(offerForm.deedId || '0'),
                  offerForm.name,
                  offerForm.symbol,
                  BigInt(offerForm.price || '0'),
                  BigInt(offerForm.max || '0'),
                  BigInt(offerForm.softCap || '0'),
                  BigInt(offerForm.deadline || '0'),
                ],
              })
            }}>Create</Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}


