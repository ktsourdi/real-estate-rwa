export type CatalogItem = {
  name: string
  symbol: string
  token: string | null
  sale: string | null
  image?: string | null
  location?: string | null
  totalPrice?: string | null
}

import { createPublicClient, decodeEventLog, http } from 'viem'
import { sepolia } from 'viem/chains'
import { propertyFactoryAbi } from './abis'

const FACTORY = process.env.NEXT_PUBLIC_PROPERTY_FACTORY as `0x${string}` | undefined
const RPC = process.env.NEXT_PUBLIC_RPC_URL

export async function rebuildCatalogFromChain(): Promise<CatalogItem[]> {
  if (!FACTORY) return []

  const client = createPublicClient({ chain: sepolia, transport: http(RPC) })

  // Fetch all logs for the factory and filter to SaleCreated
  const logs = await client.getLogs({ address: FACTORY, fromBlock: 'earliest', toBlock: 'latest' })
  const items: CatalogItem[] = []
  for (const log of logs) {
    try {
      const parsed = decodeEventLog({ abi: propertyFactoryAbi as any, data: log.data, topics: log.topics }) as any
      if (parsed.eventName === 'SaleCreated') {
        const name = parsed.args?.name as string
        const symbol = parsed.args?.symbol as string
        const token = parsed.args?.token as string
        const sale = parsed.args?.sale as string
        items.push({ name: `${name}`, symbol, token, sale })
      }
    } catch {}
  }
  // Merge with any existing metadata (image/location) if present in localStorage
  if (typeof window !== 'undefined') {
    try {
      let existing = JSON.parse(localStorage.getItem('rwa_catalog') || '[]')
      // If existing has no images, try to backfill from Pinata by name
      const needsBackfill = existing.every((e: any) => !e?.image)
      if (needsBackfill) {
        const filled = await Promise.all(items.map(async (it) => {
          try {
            const res = await fetch(`/api/pinata-search?name=${encodeURIComponent((it.name || '').replace(/ Shares$/,''))}`)
            if (!res.ok) return it
            const json = await res.json()
            return { ...it, image: json?.imageURI || it.image || null }
          } catch { return it }
        }))
        for (let i = 0; i < filled.length; i++) items[i] = filled[i]
      }
      for (const it of items) {
        const found = existing.find((e: any) => (e.sale && it.sale) && e.sale.toLowerCase() === it.sale.toLowerCase())
        if (found) {
          it.image = found.image || it.image || null
          it.location = found.location || it.location || null
          it.totalPrice = found.totalPrice || it.totalPrice || null
          // prefer existing display name if different
          it.name = found.name || it.name
          it.symbol = found.symbol || it.symbol
        }
      }
      localStorage.setItem('rwa_catalog', JSON.stringify(items))
    } catch {}
  }
  return items
}
