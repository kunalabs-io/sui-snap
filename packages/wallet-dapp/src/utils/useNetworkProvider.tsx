import { getFullnodeUrl } from '@mysten/sui.js/client'
import { createContext, useContext } from 'react'
import { SuiChain } from '@mysten/wallet-standard'

export const NETWORK_MAINNET = 'mainnet'
export const NETWORK_TESTNET = 'testnet'
export const NETWORK_DEVNET = 'devnet'
export const NETWORK_LOCAL = 'local'

export type NETWORK = typeof NETWORK_MAINNET | typeof NETWORK_TESTNET | typeof NETWORK_DEVNET | typeof NETWORK_LOCAL

export function fullnodeUrlFromNetwork(network: NETWORK): string {
  switch (network) {
    case NETWORK_MAINNET:
      return 'https://fullnode.mainnet.sui.io:443'
    case NETWORK_TESTNET:
      return 'https://fullnode.testnet.sui.io:443'
    case NETWORK_DEVNET:
      return 'https://fullnode.devnet.sui.io:443'
    case NETWORK_LOCAL:
      return 'http://127.0.0.1:9000'
  }
}

export function chainFromNetwork(network: NETWORK): SuiChain {
  switch (network) {
    case NETWORK_MAINNET:
      return 'sui:mainnet'
    case NETWORK_TESTNET:
      return 'sui:testnet'
    case NETWORK_DEVNET:
      return 'sui:devnet'
    case NETWORK_LOCAL:
      return 'sui:localnet'
  }
}

interface NetworkContextType {
  network: NETWORK
  fullnodeUrl: string
  chain: SuiChain
  setNetwork: (network: NETWORK) => void
}

export const NetworkContext = createContext<NetworkContextType>({
  network: 'mainnet',
  fullnodeUrl: getFullnodeUrl('mainnet'),
  chain: 'sui:mainnet',
  setNetwork: () => {
    /* noop */
  },
})

export const useNetwork = (): NetworkContextType => useContext(NetworkContext)
