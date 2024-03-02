import { createNetworkConfig } from '@mysten/dapp-kit'
import { createContext, useContext } from 'react'

export const NETWORK_MAINNET = 'mainnet'
export const NETWORK_TESTNET = 'testnet'
export const NETWORK_DEVNET = 'devnet'
export const NETWORK_LOCAL = 'local'

export type NETWORK = typeof NETWORK_MAINNET | typeof NETWORK_TESTNET | typeof NETWORK_DEVNET | typeof NETWORK_LOCAL

export const { networkConfig } = createNetworkConfig({
  [NETWORK_MAINNET]: { url: 'https://fullnode.mainnet.sui.io:443' },
  [NETWORK_TESTNET]: { url: 'https://fullnode.testnet.sui.io:443' },
  [NETWORK_DEVNET]: { url: 'https://fullnode.devnet.sui.io:443' },
  [NETWORK_LOCAL]: { url: 'http://127.0.0.1:9000' },
})

export type SuiChain = `${'sui'}:${'mainnet' | 'testnet' | 'devnet' | 'localnet'}`

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
  chain: SuiChain
  setNetwork: (network: NETWORK) => void
}

export const NetworkContext = createContext<NetworkContextType>({
  network: 'mainnet',
  chain: 'sui:mainnet',
  setNetwork: () => {
    /* noop */
  },
})

export const useNetwork = (): NetworkContextType => useContext(NetworkContext)
