'use client'

import { useState } from 'react'
import { useAccount, useWriteContract } from 'wagmi'
import { realEstateDeedAbi, fractionFactoryAbi } from '@/lib/abis'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const ADMIN = process.env.NEXT_PUBLIC_ADMIN_ADDRESS?.toLowerCase()
const DEED = process.env.NEXT_PUBLIC_DEED as `0x${string}`
const FACTORY = process.env.NEXT_PUBLIC_FACTORY as `0x${string}`

export default function AdminPage() {
  const { address } = useAccount()
  const isAdmin = address && ADMIN && address.toLowerCase() === ADMIN

  const [mintForm, setMintForm] = useState({ to: '', tokenId: '', tokenURI: '' })
  const [offerForm, setOfferForm] = useState({
    deedId: '', name: '', symbol: '', price: '', max: '', softCap: '', deadline: ''
  })

  const { writeContractAsync: writeDeed, isPending: minting } = useWriteContract()
  const { writeContractAsync: writeFactory, isPending: creating } = useWriteContract()

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
            <div>
              <Label>To</Label>
              <Input value={mintForm.to} onChange={(e) => setMintForm({ ...mintForm, to: e.target.value })} placeholder="0x..." />
            </div>
            <div>
              <Label>Token ID</Label>
              <Input value={mintForm.tokenId} onChange={(e) => setMintForm({ ...mintForm, tokenId: e.target.value })} placeholder="1" />
            </div>
            <div>
              <Label>Token URI (IPFS/HTTP)</Label>
              <Input value={mintForm.tokenURI} onChange={(e) => setMintForm({ ...mintForm, tokenURI: e.target.value })} placeholder="ipfs://..." />
            </div>
            <Button disabled={minting} onClick={async () => {
              await writeDeed({
                address: DEED,
                abi: realEstateDeedAbi,
                functionName: 'mint',
                args: [mintForm.to as `0x${string}`, BigInt(mintForm.tokenId || '0'), mintForm.tokenURI],
              })
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


