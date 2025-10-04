import { publicClient } from './publicClient'
import { erc20Abi, vaultAbi } from './abis'

export const VAULT = process.env.NEXT_PUBLIC_VAULT as `0x${string}` | undefined
export const USD = process.env.NEXT_PUBLIC_USD as `0x${string}` | undefined

export async function getVaultBalance(user?: `0x${string}`): Promise<bigint> {
  if (!VAULT || !user) return BigInt(0)
  try {
    const bal = await publicClient.readContract({ address: VAULT, abi: vaultAbi as any, functionName: 'balanceOf', args: [user] }) as any
    return BigInt(bal || 0)
  } catch { return BigInt(0) }
}

export async function getVaultFeeBps(): Promise<number> {
  if (!VAULT) return 200
  try {
    const fee = await publicClient.readContract({ address: VAULT, abi: vaultAbi as any, functionName: 'feeBps', args: [] }) as any
    return Number(fee || 200)
  } catch { return 200 }
}

export async function getTokenDecimals(): Promise<number> {
  if (!USD) return 18
  try {
    const d = await publicClient.readContract({ address: USD, abi: erc20Abi as any, functionName: 'decimals', args: [] }) as any
    return Number(d || 18)
  } catch { return 18 }
}


