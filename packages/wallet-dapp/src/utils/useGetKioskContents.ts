import { KIOSK_ITEM, KioskClient, KioskItem, KioskOwnerCap } from '@mysten/kiosk'
import { useQuery } from '@tanstack/react-query'
import type { SuiGraphQLClient } from '@mysten/sui/graphql'

import { getKioskIdFromOwnerCap, ORIGINBYTE_KIOSK_OWNER_TOKEN } from './kiosk'
import { useKioskClientProvider } from './useKioskClientProvider'
import { useNetwork } from './useNetworkProvider'
import { useCurrentAccount, useCurrentClient } from '@mysten/dapp-kit-react'

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

async function getOriginByteKioskContents(
  address: string,
  client: SuiGraphQLClient
): Promise<Kiosk[]> {
  // Fetch all OwnerToken caps the address holds. Single `type` filter on
  // the core API matches the legacy `StructType` filter.
  const ownerCapsRes = await client.core.listOwnedObjects({
    owner: address,
    type: ORIGINBYTE_KIOSK_OWNER_TOKEN,
    include: { json: true },
  })
  const kioskIds = ownerCapsRes.objects
    .map(o => getKioskIdFromOwnerCap(o.json as Record<string, unknown> | null))
    .filter(id => id !== '')
  if (kioskIds.length === 0) {
    return []
  }

  // Confirm each kiosk object exists (mirrors the legacy multiGetObjects
  // pass).
  const ownedKiosksRes = await client.core.getObjects({ objectIds: kioskIds })
  const validKioskIds: string[] = []
  for (const entry of ownedKiosksRes.objects) {
    if (!(entry instanceof Error)) {
      validKioskIds.push(entry.objectId)
    }
  }

  const contents = await Promise.all(
    validKioskIds.map(async kioskId => {
      const dynFields = await client.core.listDynamicFields({ parentId: kioskId })
      const itemIds = dynFields.dynamicFields
        .filter(df => df.type === KIOSK_ITEM)
        .map(df => df.fieldId)
      if (itemIds.length === 0) {
        return {
          itemIds,
          items: [],
          kioskId,
          type: KioskTypes.ORIGINBYTE,
        } satisfies Kiosk
      }
      const itemsRes = await client.core.getObjects({
        objectIds: itemIds,
        include: { display: true },
      })
      // The Kiosk type's `items: KioskItem[]` is from @mysten/kiosk; we
      // adapt the core API's `Object` shape to it by spreading the
      // available fields and setting `kioskId`.
      const items: KioskItem[] = itemsRes.objects
        .filter((o): o is Exclude<typeof o, Error> => !(o instanceof Error))
        .map(o => ({
          objectId: o.objectId,
          type: o.type,
          isLocked: false,
          kioskId,
          data: {
            objectId: o.objectId,
            type: o.type,
            display: {
              data: (o.display?.output ?? null) as Record<string, string> | null,
              error: null,
            },
          } as unknown as KioskItem['data'],
        }))
      return { itemIds, items, kioskId, type: KioskTypes.ORIGINBYTE } satisfies Kiosk
    })
  )
  return contents
}

async function getSuiKioskContents(address: string, kioskClient: KioskClient): Promise<Kiosk[]> {
  const ownedKiosks = await kioskClient.getOwnedKiosks({ address })
  return Promise.all(
    ownedKiosks.kioskIds.map(async (id: string) => {
      const kiosk = await kioskClient.getKiosk({
        id,
        options: { withObjects: true },
      })
      return {
        itemIds: kiosk.itemIds,
        items: kiosk.items,
        kioskId: id,
        type: KioskTypes.SUI,
        ownerCap: ownedKiosks.kioskOwnerCaps.find(k => k.kioskId === id),
      } satisfies Kiosk
    })
  )
}

export function useGetKioskContents() {
  const suiClient = useCurrentClient()
  const { network } = useNetwork()
  const kioskClient = useKioskClientProvider()
  const currentAccount = useCurrentAccount()

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
