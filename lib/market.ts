import { decodeEventLog } from 'viem'
import { marketplaceAbi } from './abis'
import { publicClient } from './publicClient'

export type MarketListing = {
  id: number
  token: string
  remaining: number
  price6: number
  seller: string
}

const MARKETPLACE = process.env.NEXT_PUBLIC_MARKETPLACE as `0x${string}` | undefined

export async function rebuildMarketplaceListingsFromChain(): Promise<MarketListing[]> {
  if (!MARKETPLACE) return []
  const logs = await publicClient.getLogs({ address: MARKETPLACE, fromBlock: 'earliest', toBlock: 'latest' })

  const byId: Record<string, MarketListing> = {}

  for (const log of logs) {
    try {
      const parsed = decodeEventLog({ abi: marketplaceAbi as any, data: log.data, topics: log.topics }) as any
      if (parsed.eventName === 'Listed') {
        const id = Number(parsed.args.id)
        const seller = String(parsed.args.seller)
        const token = String(parsed.args.token)
        const amount = Number(parsed.args.amount)
        const price6 = Number(parsed.args.pricePerTokenUSD6)
        byId[id] = { id, seller, token, remaining: amount, price6 }
      } else if (parsed.eventName === 'Purchased') {
        const id = Number(parsed.args.id)
        const amt = Number(parsed.args.amount)
        if (byId[id]) byId[id].remaining = Math.max(0, (byId[id].remaining || 0) - amt)
      } else if (parsed.eventName === 'Cancelled') {
        const id = Number(parsed.args.id)
        if (byId[id]) byId[id].remaining = 0
      }
    } catch {}
  }

  // Keep only active
  const active = Object.values(byId).filter((l) => l.remaining > 0)

  // Optionally, verify current remaining from contract storage for correctness
  try {
    const verified = await Promise.all(active.map(async (l) => {
      try {
        const res = await publicClient.readContract({ address: MARKETPLACE, abi: marketplaceAbi as any, functionName: 'listings', args: [BigInt(l.id)] }) as any
        const remaining = Number(res?.[2] ?? l.remaining)
        const price = Number(res?.[3] ?? l.price6)
        return { ...l, remaining, price6: price }
      } catch { return l }
    }))
    return verified.filter((l) => l.remaining > 0)
  } catch {
    return active
  }
}
