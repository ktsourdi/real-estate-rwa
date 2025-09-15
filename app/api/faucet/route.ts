import { NextRequest, NextResponse } from 'next/server'
import { createWalletClient, http, parseUnits } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { sepolia } from 'viem/chains'
import { usdAbi } from '@/lib/abis'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { to, amount } = body as { to?: string; amount?: number }

    if (!to || typeof to !== 'string') {
      return NextResponse.json({ error: 'Missing "to" address' }, { status: 400 })
    }

    const faucetPk = process.env.FAUCET_PRIVATE_KEY
    const usdAddress = process.env.NEXT_PUBLIC_USD
    const rpcUrl = process.env.RPC_URL_SEPOLIA

    if (!faucetPk || !usdAddress || !rpcUrl) {
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
    }

    const account = privateKeyToAccount((faucetPk.startsWith('0x') ? faucetPk : `0x${faucetPk}`) as `0x${string}`)
    const client = createWalletClient({ account, chain: sepolia, transport: http(rpcUrl) })

    // Default to minting 100 DUSD (6 decimals), enforce 10,000 max per request
    const requested = Number.isFinite(amount) && (amount as number) > 0 ? (amount as number) : 100
    const capped = Math.min(requested, 10000)
    const mintAmount = parseUnits(String(capped), 6)

    // USDStableToken is Ownable; mint is owner-only
    const hash = await client.writeContract({ address: usdAddress as `0x${string}`, abi: usdAbi as any, functionName: 'mint', args: [to as `0x${string}`, mintAmount] })

    return NextResponse.json({ hash, minted: capped })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to mint' }, { status: 500 })
  }
}


