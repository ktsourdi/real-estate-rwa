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

export type TradeEvent = {
  id: number
  token: string
  price6: number
  amount: number
  side: 'buy' | 'sell'
  maker: string
  taker?: string
  blockNumber: number
  timestamp?: number
}

export type OrderBook = {
  token: string
  asks: { price6: number; amount: number; seller: string; id: number }[]
  bids: { price6: number; amount: number; buyer?: string }[]
}

// Build a lightweight trade history and order book from events. Since the
// Marketplace only exposes ask listings on-chain, bids are inferred from
// purchases at or above the best ask and grouped by price for display.
export async function buildMarketData(token?: string): Promise<{
  orderBook: OrderBook
  trades: TradeEvent[]
  lastPrice6: number | null
}> {
  if (!MARKETPLACE) return { orderBook: { token: token || '', asks: [], bids: [] }, trades: [], lastPrice6: null }

  const logs = await publicClient.getLogs({ address: MARKETPLACE, fromBlock: 'earliest', toBlock: 'latest' })
  const asksById: Record<number, { id: number; seller: string; token: string; remaining: number; price6: number; blockNumber: number }> = {}
  const trades: TradeEvent[] = []

  for (const log of logs) {
    try {
      const parsed = decodeEventLog({ abi: marketplaceAbi as any, data: log.data, topics: log.topics }) as any
      if (parsed.eventName === 'Listed') {
        const id = Number(parsed.args.id)
        const tok = String(parsed.args.token)
        const amount = Number(parsed.args.amount)
        const price6 = Number(parsed.args.pricePerTokenUSD6)
        asksById[id] = { id, seller: String(parsed.args.seller), token: tok, remaining: amount, price6, blockNumber: Number(log.blockNumber || 0) }
      } else if (parsed.eventName === 'Purchased') {
        const id = Number(parsed.args.id)
        const amt = Number(parsed.args.amount)
        const cost = Number(parsed.args.costUSD6)
        const ask = asksById[id]
        if (ask) ask.remaining = Math.max(0, (ask.remaining || 0) - amt)
        trades.push({ id, token: ask?.token || '', price6: Math.round(cost / Math.max(1, amt)), amount: amt, side: 'buy', maker: ask?.seller || '', taker: String(parsed.args.buyer), blockNumber: Number(log.blockNumber || 0) })
      } else if (parsed.eventName === 'Cancelled') {
        const id = Number(parsed.args.id)
        if (asksById[id]) asksById[id].remaining = 0
      }
    } catch {}
  }

  // timestamps
  try {
    const uniqueBlocks = Array.from(new Set(trades.map((t) => t.blockNumber)))
    const blockDetails = await Promise.all(uniqueBlocks.map(async (bn) => {
      try { return [bn, await publicClient.getBlock({ blockNumber: BigInt(bn) })] as const } catch { return [bn, null] as const }
    }))
    const blockToTs: Record<number, number> = {}
    for (const [bn, blk] of blockDetails) if (blk) blockToTs[Number(bn)] = Number(blk.timestamp)
    for (const t of trades) t.timestamp = blockToTs[t.blockNumber]
  } catch {}

  let asks = Object.values(asksById)
    .filter((a) => a.remaining > 0 && (!token || a.token.toLowerCase() === token.toLowerCase()))
    .map((a) => ({ price6: a.price6, amount: a.remaining, seller: a.seller, id: a.id }))
  asks.sort((a, b) => a.price6 - b.price6)
  const bidsMap = new Map<number, number>()
  for (const t of trades) {
    if (token && t.token && t.token.toLowerCase() !== token.toLowerCase()) continue
    bidsMap.set(t.price6, (bidsMap.get(t.price6) || 0) + t.amount)
  }
  const bids = Array.from(bidsMap.entries()).map(([price6, amount]) => ({ price6, amount }))
  bids.sort((a, b) => b.price6 - a.price6)

  const last = trades
    .filter((t) => (!token || t.token.toLowerCase() === token.toLowerCase()))
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))[0]?.price6 ?? null

  return { orderBook: { token: token || '', asks, bids }, trades, lastPrice6: last }
}
