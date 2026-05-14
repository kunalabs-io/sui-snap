import { useCurrentNetwork, useDAppKit } from '@mysten/dapp-kit-react'

export const NETWORKS: ['mainnet', 'testnet', 'devnet'] = [
  'mainnet',
  'testnet',
  'devnet',
]

export type NETWORK = (typeof NETWORKS)[number]

export const NETWORK_MAINNET: NETWORK = 'mainnet'
export const NETWORK_TESTNET: NETWORK = 'testnet'
export const NETWORK_DEVNET: NETWORK = 'devnet'

export const NETWORK_GRAPHQL_URLS: Record<NETWORK, string> = {
  mainnet: 'https://graphql.mainnet.sui.io/graphql',
  testnet: 'https://graphql.testnet.sui.io/graphql',
  devnet: 'https://graphql.devnet.sui.io/graphql',
}

export type SuiChain = `${'sui'}:${'mainnet' | 'testnet' | 'devnet'}`

export function chainFromNetwork(network: NETWORK): SuiChain {
  return `sui:${network}`
}

const NETWORK_STORAGE_KEY = 'network'

/**
 * Convenience wrapper that pairs the dapp-kit-react `useCurrentNetwork()`
 * value with the corresponding `sui:<network>` chain identifier and a
 * setter that routes back through `useDAppKit().switchNetwork(...)`. This
 * preserves the `const { network, chain, setNetwork } = useNetwork()` call
 * shape the rest of the wallet-dapp uses.
 *
 * dapp-kit-react persists wallet+account state but not the active
 * network, so `setNetwork` also writes to localStorage; dappkit.ts reads
 * it back on mount as the `defaultNetwork` argument to `createDAppKit`.
 */
export function useNetwork() {
  const dAppKit = useDAppKit()
  const network = useCurrentNetwork() as NETWORK
  return {
    network,
    chain: chainFromNetwork(network),
    setNetwork: (n: NETWORK) => {
      dAppKit.switchNetwork(n)
      try {
        window.localStorage.setItem(NETWORK_STORAGE_KEY, JSON.stringify(n))
      } catch {
        /* localStorage may be unavailable (SSR, private mode); ignore. */
      }
    },
  }
}
