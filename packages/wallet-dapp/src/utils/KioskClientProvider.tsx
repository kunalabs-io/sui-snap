import { KioskClient, Network } from '@mysten/kiosk'
import { FC, ReactNode, useMemo } from 'react'

import { KioskClientProviderContext } from './useKioskClientProvider'
import { useSuiClientProvider } from './useSuiClientProvider'
import { useNetwork } from './useNetworkProvider'

export interface KioskClientProviderProps {
  children: ReactNode
}

export const KioskClientProvider: FC<KioskClientProviderProps> = ({ children }) => {
  const suiClient = useSuiClientProvider()
  const { network } = useNetwork()

  let kioskNetwork: Network = Network.CUSTOM
  switch (network) {
    case 'mainnet':
      kioskNetwork = Network.MAINNET
      break
    case 'testnet':
      kioskNetwork = Network.TESTNET
      break
  }
  console.log(suiClient, kioskNetwork)

  const provider = useMemo(() => {
    const client = new KioskClient({
      client: suiClient,
      network: kioskNetwork,
    })
    return client
  }, [suiClient, kioskNetwork])

  return <KioskClientProviderContext.Provider value={{ provider }}>{children}</KioskClientProviderContext.Provider>
}
