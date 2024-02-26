import { KioskClient, Network } from '@mysten/kiosk'
import { FC, ReactNode, useMemo } from 'react'

import { KioskClientProviderContext } from './useKioskClientProvider'
import { useSuiClientProvider } from './useSuiClientProvider'

export interface KioskClientProviderProps {
  children: ReactNode
  network: Network
}

export const KioskClientProvider: FC<KioskClientProviderProps> = ({ children, network }) => {
  const suiClient = useSuiClientProvider()

  const provider = useMemo(() => {
    const client = new KioskClient({
      client: suiClient,
      network: network,
    })
    return client
  }, [suiClient, network])

  return <KioskClientProviderContext.Provider value={{ provider }}>{children}</KioskClientProviderContext.Provider>
}
