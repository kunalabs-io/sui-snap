import { createContext, useContext } from 'react'

interface NetworkContextType {
  network: string
  setNetwork: (network: string) => void
}

// eslint-disable-next-line @typescript-eslint/no-empty-function, prettier/prettier
export const NetworkContext = createContext<NetworkContextType>({ network: "", setNetwork: () => {} })


export const useNetwork = (): NetworkContextType => useContext(NetworkContext)
