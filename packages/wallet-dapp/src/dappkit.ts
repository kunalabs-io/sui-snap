import { createDAppKit } from '@mysten/dapp-kit-react'
import { SuiJsonRpcClient } from '@mysten/sui/jsonRpc'

import { NETWORK, NETWORKS, NETWORK_URLS } from 'utils/useNetworkProvider'

const NETWORK_STORAGE_KEY = 'network'

function readStoredNetwork(): NETWORK {
  try {
    const raw = window.localStorage.getItem(NETWORK_STORAGE_KEY)
    if (raw === null) {
      return 'mainnet'
    }
    const parsed = JSON.parse(raw)
    if (NETWORKS.includes(parsed)) {
      return parsed
    }
  } catch {
    /* localStorage unavailable; fall through. */
  }
  return 'mainnet'
}

/**
 * Module-scope dapp-kit instance. Creating it at module scope (rather than
 * inside the component tree) gives us a stable TypeScript type that we can
 * register globally via module augmentation, so `useCurrentClient` /
 * `useDAppKit` / `useCurrentAccount` etc. all resolve to our concrete
 * `SuiJsonRpcClient` instead of the generic `ClientWithCoreApi` upper bound.
 */
export const dAppKit = createDAppKit({
  networks: NETWORKS,
  defaultNetwork: readStoredNetwork(),
  autoConnect: true,
  createClient: network =>
    new SuiJsonRpcClient({ url: NETWORK_URLS[network as NETWORK], network }),
})

// Register the dAppKit type globally so dapp-kit-react hooks (useDAppKit,
// useCurrentClient, useCurrentAccount, ...) resolve to our concrete client
// and network tuple instead of the generic upper bounds.
declare module '@mysten/dapp-kit-react' {
  interface Register {
    dAppKit: typeof dAppKit
  }
}
