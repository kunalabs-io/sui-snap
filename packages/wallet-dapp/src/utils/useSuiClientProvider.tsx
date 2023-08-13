import { SuiClient } from '@mysten/sui.js/client'
import { createContext, useContext } from 'react'

export interface SuiClientProviderContextState {
  provider: SuiClient
}

export const SuiClientProviderContext = createContext<SuiClientProviderContextState>(
  {} as SuiClientProviderContextState
)

export function useSuiClientProvider(): SuiClient {
  return useContext(SuiClientProviderContext).provider
}
