import { KioskClient } from '@mysten/kiosk'
import { FC, ReactNode, useMemo } from 'react'

import { KioskClientProviderContext } from './useKioskClientProvider'
import { useNetwork } from './useNetworkProvider'
import { useCurrentClient } from '@mysten/dapp-kit-react'

export interface KioskClientProviderProps {
  children: ReactNode
}

export const KioskClientProvider: FC<KioskClientProviderProps> = ({ children }) => {
  const suiClient = useCurrentClient()
  const { network } = useNetwork()

  // The kiosk client treats unknown values the same as 'custom' (no preloaded rules).
  const kioskNetwork = network === 'mainnet' || network === 'testnet' ? network : 'custom'

  const provider = useMemo(() => {
    const client = new KioskClient({
      client: suiClient,
      network: kioskNetwork,
    })
    return client
  }, [suiClient, kioskNetwork])

  return <KioskClientProviderContext.Provider value={{ provider }}>{children}</KioskClientProviderContext.Provider>
}
