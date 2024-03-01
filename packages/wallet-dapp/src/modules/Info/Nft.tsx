import { useCallback, useState } from 'react'
import styled from 'styled-components'
import { SuiObjectResponse } from '@mysten/sui.js/client'

import Spinner from 'components/Spinner'
import { useOwnedObjects } from 'utils/useOwnedObjects'
import { WALLET_BALANCES_REFETCH_INTERVAL } from 'utils/const'
import { NftDetails } from './NftDetails'
import { Kiosk as KioskType, useGetKioskContents } from 'utils/useGetKioskContents'
import { Kiosk } from './Kiosk'
import { KioskDetails } from './KioskDetails'
import { NftImageContainer } from './NftImageContainer'
import { formatImgUrl } from 'utils/images'

const Container = styled.div<{ isScrollable: boolean }>`
  padding-top: 16px;
  padding-left: 24px;
  padding-right: 24px;
  display: flex;
  ${p => (p.isScrollable ? `flex-wrap: wrap; gap: 8px` : `justify-content: space-between`)}
`

const LoadMore = styled.div`
  text-align: center;
  padding: 16px;
  cursor: pointer;
  color: ${p => p.theme.colors.button.primary};
`

const EmptyList = styled.div`
  padding: 24px;
  text-align: center;
  color: ${p => p.theme.colors.text.secondary};
`

export const Nft = () => {
  const [activeKiosk, setActiveKiosk] = useState<KioskType>()
  const [activeNft, setActiveNft] = useState<SuiObjectResponse>()
  const { isInitialFetch, isLoading, ownedObjects, hasNextPage, loadMore } = useOwnedObjects({
    filter: {
      MatchNone: [
        {
          StructType: '0x2::coin::Coin',
        },
      ],
    },
    refetchInterval: WALLET_BALANCES_REFETCH_INTERVAL,
  })

  const { isLoading: isLoadingKiosks, data: ownedKiosks } = useGetKioskContents()

  const toggleModal = useCallback((nft?: SuiObjectResponse) => {
    setActiveNft(nft)
  }, [])

  const toggleKioskModal = useCallback((kiosk?: KioskType) => {
    setActiveKiosk(kiosk)
  }, [])

  const handlePageLoad = useCallback(() => {
    if (hasNextPage) {
      loadMore()
    }
  }, [loadMore, hasNextPage])

  if ((isLoading && isInitialFetch) || isLoadingKiosks) {
    return <Spinner style={{ marginTop: 48 }} />
  }

  if (!ownedObjects || !ownedKiosks) {
    return null
  }

  if (ownedObjects && ownedObjects.length === 0 && ownedKiosks && ownedKiosks.length === 0) {
    return <EmptyList>The list is currently empty.</EmptyList>
  }

  return (
    <>
      <Container isScrollable={ownedObjects.length + ownedKiosks.length > 2}>
        {ownedKiosks.map(k => {
          const kioskImages = k.items.map(i => i.data?.display?.data?.image_url)
          if (!kioskImages || kioskImages.length === 0) {
            return null
          }
          return <Kiosk key={k.kioskId} kiosk={k} toggleModal={toggleKioskModal} />
        })}
        {ownedObjects.map(o => {
          if (o.error) {
            return null
          }

          const type = o.data?.type || ''
          const address = o.data?.objectId || ''
          const imgSrc = o.data?.display?.data?.['image_url' as keyof typeof o.data.display.data] as string
          const name = o.data?.display?.data?.['name' as keyof typeof o.data.display.data] as string
          const objectId = o?.data?.objectId
          return (
            <NftImageContainer
              key={o.data?.objectId}
              toggleModal={() => toggleModal(o)}
              type={type}
              address={address}
              imgSrc={formatImgUrl(imgSrc)}
              name={name}
              objectId={objectId}
              showImgInfoOnHover={true}
              noDisplayData={o.data?.display?.data === null}
            />
          )
        })}
      </Container>
      {hasNextPage ? (
        <LoadMore onClick={handlePageLoad}>Load more</LoadMore>
      ) : isLoading ? (
        <Spinner style={{ marginTop: 16, width: 32, height: 32, marginLeft: 'calc(50% - 16px)' }} />
      ) : (
        <div style={{ height: 51 }} />
      )}
      {activeNft && <NftDetails nft={activeNft.data} toggleModal={toggleModal} />}
      {activeKiosk && <KioskDetails kiosk={activeKiosk} toggleModal={toggleKioskModal} />}
    </>
  )
}
