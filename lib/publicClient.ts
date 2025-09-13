import { createPublicClient, http, fallback } from 'viem'
import { sepolia } from 'viem/chains'

const primary = process.env.NEXT_PUBLIC_RPC_URL
const alts = [
  'https://ethereum-sepolia-rpc.publicnode.com',
  'https://eth-sepolia.public.blastapi.io',
  'https://eth-sepolia.api.onfinality.io/public',
].filter(Boolean) as string[]

export const publicClient = createPublicClient({
  chain: sepolia,
  transport: fallback([
    ...(primary ? [http(primary)] : []),
    ...alts.map((u) => http(u)),
  ]),
})


