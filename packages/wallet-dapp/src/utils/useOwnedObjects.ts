import { useCallback, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useWalletKit } from '@mysten/wallet-kit'
import { SuiObjectDataFilter, SuiObjectResponse } from '@mysten/sui.js'

import { useSuiClientProvider } from './useSuiClientProvider'
import { useNetwork } from './useNetworkProvider'

interface OwnedObjectsInfos {
  isLoading: boolean
  isInitialFetch: boolean
  hasNextPage: boolean
  nextCursor?: string | null
  ownedObjects?: SuiObjectResponse[]
  onPageLoad: (cursor: string) => void
}

const PAGE_LIMIT = 50

export const useOwnedObjects = (filter?: SuiObjectDataFilter | null | undefined): OwnedObjectsInfos => {
  const [cursor, setCursor] = useState<string | null>(null)
  const [ownedObjects, setOwnedObjects] = useState<SuiObjectResponse[]>()

  const suiClient = useSuiClientProvider()
  const { currentAccount } = useWalletKit()
  const { network } = useNetwork()

  const ownedObjectsRes = useQuery({
    queryKey: ['owned-objects', cursor || '', currentAccount?.address, network],
    enabled: !!currentAccount?.address,
    queryFn: async () => {
      if (!currentAccount?.address) {
        throw new Error('invariant violation')
      }

      const fetchedOwnedObjects = await suiClient.getOwnedObjects({
        owner: currentAccount.address,
        options: { showType: true, showDisplay: true },
        limit: PAGE_LIMIT,
        cursor,
        filter,
      })

      setOwnedObjects(ownedObjects ? ownedObjects.concat(fetchedOwnedObjects.data) : fetchedOwnedObjects.data)

      return fetchedOwnedObjects
    },
    refetchOnWindowFocus: false,
  })

  const handleCursorChange = useCallback((nextCursor: string) => {
    setCursor(nextCursor)
  }, [])

  const isLoading = ownedObjectsRes.isLoading

  return {
    isInitialFetch: cursor === null,
    isLoading,
    ownedObjects,
    hasNextPage: !!ownedObjectsRes.data?.hasNextPage,
    nextCursor: ownedObjectsRes.data?.nextCursor,
    onPageLoad: handleCursorChange,
  }
}
