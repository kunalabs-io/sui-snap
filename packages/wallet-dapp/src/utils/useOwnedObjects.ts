import { useQuery } from '@tanstack/react-query'
import { useWalletKit } from '@mysten/wallet-kit'
import { SuiObjectResponse } from '@mysten/sui.js'

import { useSuiClientProvider } from './useSuiClientProvider'
import { useNetwork } from './useNetworkProvider'

interface OwnedObjectsInfos {
  isLoading: boolean
  ownedObjects?: SuiObjectResponse[]
}

const COIN_CONTENT = '0x2::coin::Coin'

export const useOwnedObjects = (options?: { refetchInterval: number }): OwnedObjectsInfos => {
  const suiClient = useSuiClientProvider()
  const { currentAccount } = useWalletKit()
  const { network } = useNetwork()

  const ownedObjectsRes = useQuery({
    queryKey: ['owned-objects', currentAccount?.address, network],
    enabled: !!currentAccount?.address,
    queryFn: async () => {
      if (!currentAccount?.address) {
        throw new Error('invariant violation')
      }

      const ownedObjects = await suiClient.getOwnedObjects({
        owner: currentAccount.address,
        options: { showType: true, showDisplay: true },
      })

      return ownedObjects
    },
    refetchInterval: options?.refetchInterval,
  })

  const isLoading = ownedObjectsRes.isLoading

  return {
    isLoading,
    ownedObjects: ownedObjectsRes.data?.data.filter(o => !o.data?.type?.includes(COIN_CONTENT)),
  }
}
