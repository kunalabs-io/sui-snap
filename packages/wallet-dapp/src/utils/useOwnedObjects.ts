import { useCallback, useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'

import { useNetwork } from './useNetworkProvider'
import { SuiObjectDataFilter, SuiObjectResponse } from '@mysten/sui.js/client'
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit'

interface OwnedObjectsInfos {
  isLoading: boolean
  isInitialFetch: boolean
  hasNextPage: boolean
  nextCursor?: string | null
  ownedObjects?: SuiObjectResponse[]
  loadMore: () => void
}

const PAGE_LIMIT = 50

export const useOwnedObjects = (options?: {
  refetchInterval?: number
  filter?: SuiObjectDataFilter | null
}): OwnedObjectsInfos => {
  const [currentCursor, setCurrentCursor] = useState<string | null>(null)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [ownedObjects, setOwnedObjects] = useState<SuiObjectResponse[]>()

  const suiClient = useSuiClient()
  const currentAccount = useCurrentAccount()
  const { network } = useNetwork()

  useEffect(() => {
    setCurrentCursor(null)
    setNextCursor(null)
    setOwnedObjects(undefined)
  }, [network, currentAccount?.address])

  const ownedObjectsRes = useQuery({
    queryKey: [
      'owned-objects',
      currentCursor || '',
      currentAccount?.address,
      options?.filter || '',
      network,
    ],
    enabled: !!currentAccount?.address,
    queryFn: async () => {
      if (!currentAccount?.address) {
        throw new Error('invariant violation')
      }

      const fetchedOwnedObjects = await suiClient.getOwnedObjects({
        owner: currentAccount.address,
        options: { showType: true, showDisplay: true },
        limit: PAGE_LIMIT,
        cursor: currentCursor,
        filter: options?.filter,
      })

      if (!currentCursor) {
        setOwnedObjects(fetchedOwnedObjects.data)
      } else if (nextCursor === fetchedOwnedObjects.nextCursor) {
        const newOwnedObjects = ownedObjects ? [...ownedObjects] : []
        newOwnedObjects.map(ownedObj => {
          const newOwnedObj = fetchedOwnedObjects.data.find(
            o => o.data?.objectId === ownedObj.data?.objectId
          )
          if (newOwnedObj) {
            return {
              ...newOwnedObj,
            }
          }
          return {
            ...ownedObj,
          }
        })
        setOwnedObjects([...newOwnedObjects])
      } else if (fetchedOwnedObjects.nextCursor !== currentCursor) {
        setOwnedObjects(ownedObjects?.concat(fetchedOwnedObjects.data))
      }

      setNextCursor(fetchedOwnedObjects.nextCursor || null)
      return fetchedOwnedObjects
    },
    refetchInterval: currentCursor ? undefined : options?.refetchInterval,
  })

  const loadMore = useCallback(() => {
    setCurrentCursor(nextCursor)
  }, [nextCursor])

  const isLoading = ownedObjectsRes.isLoading

  return {
    isInitialFetch: currentCursor === null,
    isLoading,
    ownedObjects,
    hasNextPage: !!ownedObjectsRes.data?.hasNextPage,
    nextCursor: ownedObjectsRes.data?.nextCursor,
    loadMore,
  }
}
