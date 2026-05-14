import { useCallback, useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { SuiClientTypes } from '@mysten/sui/client'

import { useNetwork } from './useNetworkProvider'
import { useCurrentAccount, useCurrentClient } from '@mysten/dapp-kit-react'

// The `Object` view we surface to consumers. `client.core.listOwnedObjects`
// with `include: { display: true }` populates these fields.
export type OwnedObject = SuiClientTypes.Object<{ display: true }>

interface OwnedObjectsInfos {
  isLoading: boolean
  isInitialFetch: boolean
  hasNextPage: boolean
  ownedObjects?: OwnedObject[]
  loadMore: () => void
}

// Number of NFT-shaped objects we try to surface per visual page. Because we
// post-filter out coins client-side (GraphQL's `type` filter is positive-
// match only — no anti-filter exists for "everything except Coin"), each
// visual page may pull several underlying pages from the API until enough
// non-coin objects accumulate.
const TARGET_VISIBLE_PAGE_SIZE = 50
const UPSTREAM_PAGE_LIMIT = 50

// Conservatively bound the discard loop so a wallet holding nothing but
// coins can't trigger an unbounded fetch.
const MAX_UPSTREAM_PAGES_PER_VISIBLE_PAGE = 10

function isCoinObject(type: string): boolean {
  // Match both the canonical fully-qualified form
  // (0x0000…0002::coin::Coin<…>) and the short form (0x2::coin::Coin<…>).
  return /^0x0*2::coin::Coin($|<)/.test(type)
}

export const useOwnedObjects = (options?: {
  refetchInterval?: number
}): OwnedObjectsInfos => {
  const [pageIndex, setPageIndex] = useState(0)
  const [pages, setPages] = useState<OwnedObject[][]>([])
  const [upstreamCursor, setUpstreamCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)

  const suiClient = useCurrentClient()
  const currentAccount = useCurrentAccount()
  const { network } = useNetwork()

  // Reset the discard-loop state whenever the identity of the query
  // changes (account or network switch).
  useEffect(() => {
    setPageIndex(0)
    setPages([])
    setUpstreamCursor(null)
    setHasMore(true)
  }, [network, currentAccount?.address])

  const ownedObjectsRes = useQuery({
    queryKey: ['owned-objects', pageIndex, currentAccount?.address, network],
    enabled: !!currentAccount?.address && hasMore,
    queryFn: async () => {
      if (!currentAccount?.address) {
        throw new Error('invariant violation')
      }

      // Iterate upstream pages, dropping coin types, until we either
      // reach the visible-page target or run out of upstream data.
      const visiblePage: OwnedObject[] = []
      let cursor: string | null = upstreamCursor
      let upstreamHasMore = true
      let pagesPulled = 0

      while (
        visiblePage.length < TARGET_VISIBLE_PAGE_SIZE &&
        upstreamHasMore &&
        pagesPulled < MAX_UPSTREAM_PAGES_PER_VISIBLE_PAGE
      ) {
        const res = await suiClient.core.listOwnedObjects({
          owner: currentAccount.address,
          limit: UPSTREAM_PAGE_LIMIT,
          cursor,
          include: { display: true },
        })
        for (const obj of res.objects) {
          if (!isCoinObject(obj.type)) {
            visiblePage.push(obj)
          }
        }
        cursor = res.cursor
        upstreamHasMore = res.hasNextPage
        pagesPulled += 1
      }

      setUpstreamCursor(cursor)
      setHasMore(upstreamHasMore)
      setPages(prev => {
        const next = [...prev]
        next[pageIndex] = visiblePage
        return next
      })

      return { visiblePage, hasMore: upstreamHasMore }
    },
    refetchInterval: pageIndex === 0 ? options?.refetchInterval : undefined,
  })

  const loadMore = useCallback(() => {
    if (hasMore) {
      setPageIndex(p => p + 1)
    }
  }, [hasMore])

  return {
    isLoading: ownedObjectsRes.isLoading,
    isInitialFetch: pageIndex === 0,
    ownedObjects: pages.flat(),
    hasNextPage: hasMore,
    loadMore,
  }
}
