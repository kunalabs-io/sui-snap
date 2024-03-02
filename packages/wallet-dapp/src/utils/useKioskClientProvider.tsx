import { KioskClient } from '@mysten/kiosk'
import { createContext, useContext } from 'react'

export interface KioskClientProviderContextState {
  provider: KioskClient
}

export const KioskClientProviderContext = createContext<KioskClientProviderContextState>(
  {} as KioskClientProviderContextState
)

export function useKioskClientProvider(): KioskClient {
  return useContext(KioskClientProviderContext).provider
}
