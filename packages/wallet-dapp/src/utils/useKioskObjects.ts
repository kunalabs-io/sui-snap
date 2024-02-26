import { useWalletKit } from '@mysten/wallet-kit'
import { useQuery } from '@tanstack/react-query'

import { useNetwork } from './useNetworkProvider'
import { useKioskClientProvider } from './useKioskClientProvider'

export const useKioskObjects = () => {
  const kioskClient = useKioskClientProvider()
  const { currentAccount } = useWalletKit()
  const { network } = useNetwork()

  const result = useQuery({
    queryKey: ['kiosk-objects', currentAccount?.address, network],
    enabled: !!currentAccount?.address,
    queryFn: async () => {
      if (!currentAccount?.address) {
        throw new Error('invariant violation')
      }

      const ownedKiosks = await kioskClient.getOwnedKiosks({
        address: currentAccount.address,
      })

      console.log({ ownedKiosks })
      const kioskData = await Promise.all(
        ownedKiosks.kioskIds.map(id =>
          kioskClient.getKiosk({
            id,
            options: {
              withKioskFields: true,
              withListingPrices: true,
              withObjects: true,
            },
          })
        )
      )

      return kioskData
    },
  })

  return {
    isLoading: result.isLoading,
    ownedKiosks: result.data || [],
  }
}
