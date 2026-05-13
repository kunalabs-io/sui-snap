import { useCurrentNetwork, useDAppKit } from '@mysten/dapp-kit-react'

// Mutable tuple so that `createDAppKit({ networks: NETWORKS })`'s
// `TNetworks extends Networks` infers a concrete tuple (and not the wide
// `string[]` default that would leave `switchNetwork` typed as
// `(network: never) => void`). Networks is typed as a mutable array
// upstream, so a `readonly` tuple via `as const` would be rejected.
export const NETWORKS: ['mainnet', 'testnet', 'devnet', 'localnet'] = [
  'mainnet',
  'testnet',
  'devnet',
  'localnet',
]

export type NETWORK = (typeof NETWORKS)[number]

export const NETWORK_MAINNET: NETWORK = 'mainnet'
export const NETWORK_TESTNET: NETWORK = 'testnet'
export const NETWORK_DEVNET: NETWORK = 'devnet'
export const NETWORK_LOCAL: NETWORK = 'localnet'

export const NETWORK_URLS: Record<NETWORK, string> = {
  mainnet: 'https://fullnode.mainnet.sui.io:443',
  testnet: 'https://fullnode.testnet.sui.io:443',
  devnet: 'https://fullnode.devnet.sui.io:443',
  localnet: 'http://127.0.0.1:9000',
}

export type SuiChain = `${'sui'}:${'mainnet' | 'testnet' | 'devnet' | 'localnet'}`

export function chainFromNetwork(network: NETWORK): SuiChain {
  return `sui:${network}`
}

const NETWORK_STORAGE_KEY = 'network'

/**
 * Convenience wrapper that pairs the dapp-kit-react `useCurrentNetwork()` value
 * with the corresponding `sui:<network>` chain identifier and a setter that
 * routes back through `useDAppKit().switchNetwork(...)`. This preserves the
 * `const { network, chain, setNetwork } = useNetwork()` call shape the rest of
 * the wallet-dapp uses.
 *
 * dapp-kit-react persists wallet+account state but not the active network, so
 * `setNetwork` also writes to localStorage; App.tsx reads it back on mount as
 * the `defaultNetwork` argument to `createDAppKit`.
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
