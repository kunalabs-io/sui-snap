import { createDAppKit } from '@mysten/dapp-kit-react'
import { SuiGraphQLClient } from '@mysten/sui/graphql'

import { NETWORK, NETWORKS, NETWORK_GRAPHQL_URLS } from 'utils/useNetworkProvider'

const NETWORK_STORAGE_KEY = 'network'

function readStoredNetwork(): NETWORK {
  try {
    const raw = window.localStorage.getItem(NETWORK_STORAGE_KEY)
    if (raw === null) {
      return 'mainnet'
    }
    const parsed = JSON.parse(raw)
    if ((NETWORKS as readonly string[]).includes(parsed)) {
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
 * `SuiGraphQLClient` instead of the generic `ClientWithCoreApi` upper
 * bound.
 */
export const dAppKit = createDAppKit({
  networks: NETWORKS,
  defaultNetwork: readStoredNetwork(),
  autoConnect: true,
  createClient: network =>
    new SuiGraphQLClient({
      url: NETWORK_GRAPHQL_URLS[network as NETWORK],
      network,
    }),
})

declare module '@mysten/dapp-kit-react' {
  interface Register {
    dAppKit: typeof dAppKit
  }
}
