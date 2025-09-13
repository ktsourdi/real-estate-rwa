import { http, createConfig } from 'wagmi'
import { walletConnect, injected } from 'wagmi/connectors'
import { sepolia } from 'wagmi/chains'

const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc.ankr.com/eth_sepolia'
const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID

export const config = createConfig({
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(rpcUrl),
  },
  connectors: [
    injected({ shimDisconnect: true }),
    ...(walletConnectProjectId
      ? [walletConnect({ projectId: walletConnectProjectId })]
      : []),
  ],
})

export type AppConfig = typeof config


