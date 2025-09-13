'use client'

import { useMemo } from 'react'
import { useAccount, useDisconnect, useConnect } from 'wagmi'
import { Button } from '@/components/ui/button'
import { Wallet } from 'lucide-react'

function truncateAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}

export function ConnectButton() {
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const { connect, connectors, isPending } = useConnect()

  const preferred = useMemo(() => {
    // Prefer injected if available, else first available (walletconnect/etc)
    const injected = connectors.find((c) => c.id === 'injected' && c.ready)
    return injected ?? connectors[0]
  }, [connectors])

  if (isConnected && address) {
    return (
      <Button variant="outline" size="sm" onClick={() => disconnect()}>
        <Wallet className="w-4 h-4 mr-2" />
        {truncateAddress(address)}
      </Button>
    )
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => preferred && connect({ connector: preferred })}
      disabled={!preferred || isPending}
    >
      <Wallet className="w-4 h-4 mr-2" />
      {isPending ? 'Connecting…' : 'Connect Wallet'}
    </Button>
  )
}


