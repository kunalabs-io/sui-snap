import { KIOSK_ITEM, KioskClient, KioskItem, KioskOwnerCap } from '@mysten/kiosk'
import { SuiClient } from '@mysten/sui.js/client'
import { useQuery } from '@tanstack/react-query'
import { useWalletKit } from '@mysten/wallet-kit'

import { getKioskIdFromOwnerCap, ORIGINBYTE_KIOSK_OWNER_TOKEN } from './kiosk'
import { useKioskClientProvider } from './useKioskClientProvider'
import { useSuiClientProvider } from './useSuiClientProvider'
import { useNetwork } from './useNetworkProvider'

export enum KioskTypes {
  SUI = 'sui',
  ORIGINBYTE = 'originByte',
}

export type Kiosk = {
  items: KioskItem[]
  itemIds: string[]
  kioskId: string
  type: KioskTypes
  ownerCap?: KioskOwnerCap
}

async function getOriginByteKioskContents(address: string, client: SuiClient) {
  const data = await client.getOwnedObjects({
    owner: address,
    filter: {
      StructType: ORIGINBYTE_KIOSK_OWNER_TOKEN,
    },
    options: {
      showContent: true,
    },
  })
  const ids = data.data.map(object => getKioskIdFromOwnerCap(object))

  const ownedKiosks = await client.multiGetObjects({
    ids: ids.flat(),
    options: {
      showContent: true,
    },
  })

  const contents = await Promise.all(
    ownedKiosks
      .map(async kiosk => {
        if (!kiosk.data) return
        const objects = await client.getDynamicFields({
          parentId: kiosk.data.objectId,
        })

        const objectIds = objects.data
          .filter(obj => obj.name.type === KIOSK_ITEM)
          .map(obj => obj.objectId)

        const kioskContent = await client.multiGetObjects({
          ids: objectIds,
          options: {
            showDisplay: true,
            showType: true,
          },
        })

        return {
          itemIds: objectIds,
          items: kioskContent.map(item => ({ ...item, kioskId: kiosk.data?.objectId })),
          kioskId: kiosk.data.objectId,
          type: KioskTypes.ORIGINBYTE,
        }
      })
      .filter(Boolean) as Promise<Kiosk>[]
  )
  return contents
}

async function getSuiKioskContents(address: string, kioskClient: KioskClient) {
  const ownedKiosks = await kioskClient.getOwnedKiosks({ address })
  const contents = await Promise.all(
    ownedKiosks.kioskIds.map(async (id: string) => {
      const kiosk = await kioskClient.getKiosk({
        id,
        options: {
          withObjects: true,
          objectOptions: { showDisplay: true, showContent: true },
        },
      })
      return {
        itemIds: kiosk.itemIds,
        items: kiosk.items,
        kioskId: id,
        type: KioskTypes.SUI,
        ownerCap: ownedKiosks.kioskOwnerCaps.find(k => k.kioskId === id),
      }
    })
  )
  return contents
}

export function useGetKioskContents() {
  const suiClient = useSuiClientProvider()
  const { network } = useNetwork()
  const kioskClient = useKioskClientProvider()
  const { currentAccount } = useWalletKit()

  return useQuery({
    queryKey: ['get-kiosk-contents', currentAccount?.address, network, kioskClient.network],
    queryFn: async () => {
      if (!currentAccount?.address) {
        throw new Error('invariant violation')
      }
      const [suiKiosks, obKiosks] = await Promise.all([
        getSuiKioskContents(currentAccount.address, kioskClient),
        getOriginByteKioskContents(currentAccount.address, suiClient),
      ])
      return [...suiKiosks, ...obKiosks]
    },
    enabled: !!currentAccount?.address,
  })
}
