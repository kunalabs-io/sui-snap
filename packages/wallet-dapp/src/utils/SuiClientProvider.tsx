import { SuiClient } from '@mysten/sui.js/client'
import { FC, ReactNode, useMemo } from 'react'

import { SuiClientProviderContext } from './useSuiClientProvider'

export interface SuiClientProviderProps {
  children: ReactNode
  connectionUrl: string
}

export const SuiClientProvider: FC<SuiClientProviderProps> = ({ children, connectionUrl }) => {
  const provider = useMemo(() => {
    const client = new SuiClient({
      url: connectionUrl,
    })
    return client
  }, [connectionUrl])

  return <SuiClientProviderContext.Provider value={{ provider }}>{children}</SuiClientProviderContext.Provider>
}
