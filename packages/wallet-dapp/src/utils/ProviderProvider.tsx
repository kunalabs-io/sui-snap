import { Connection, JsonRpcProvider, RpcProviderOptions } from '@mysten/sui.js'
import { FC, ReactNode, useMemo } from 'react'

import { ProviderContext } from './useProvider'

export interface ConnectionProviderProps {
  children: ReactNode
  connection: Connection
  options?: RpcProviderOptions
}

export const ProviderProvider: FC<ConnectionProviderProps> = ({ children, connection, options }) => {
  const provider = useMemo(() => new JsonRpcProvider(connection, options), [connection, options])

  return <ProviderContext.Provider value={{ provider }}>{children}</ProviderContext.Provider>
}
