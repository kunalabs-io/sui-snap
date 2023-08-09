import { JsonRpcProvider } from '@mysten/sui.js'
import { createContext, useContext } from 'react'

export interface ProviderContextState {
  provider: JsonRpcProvider
}

export const ProviderContext = createContext<ProviderContextState>({} as ProviderContextState)

export function useProvider(): JsonRpcProvider {
  return useContext(ProviderContext).provider
}
