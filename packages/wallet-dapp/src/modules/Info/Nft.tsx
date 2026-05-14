import { useCallback, useState } from 'react'
import styled from 'styled-components'

import Spinner from 'components/Spinner'
import { useOwnedObjects, OwnedObject } from 'utils/useOwnedObjects'
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
  const [activeNft, setActiveNft] = useState<OwnedObject>()
  const { isInitialFetch, isLoading, ownedObjects, hasNextPage, loadMore } = useOwnedObjects({
    refetchInterval: WALLET_BALANCES_REFETCH_INTERVAL,
  })

  const { isLoading: isLoadingKiosks, data: ownedKiosks } = useGetKioskContents()

  const toggleModal = useCallback((nft?: OwnedObject) => {
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
          const kioskImages = k.items.map(i => {
            const data = i.data?.display?.data as Record<string, string> | undefined | null
            return data?.image_url
          })
          if (!kioskImages || kioskImages.length === 0) {
            return null
          }
          return <Kiosk key={k.kioskId} kiosk={k} toggleModal={toggleKioskModal} />
        })}
        {ownedObjects.map(o => {
          const displayOutput = o.display?.output as Record<string, unknown> | undefined | null
          const imgSrc = displayOutput?.image_url as string | undefined
          const name = displayOutput?.name as string | undefined
          return (
            <NftImageContainer
              key={o.objectId}
              toggleModal={() => toggleModal(o)}
              type={o.type}
              address={o.objectId}
              imgSrc={formatImgUrl(imgSrc)}
              name={name}
              objectId={o.objectId}
              showImgInfoOnHover={true}
              noDisplayData={o.display?.output == null}
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
      {activeNft && (
        <NftDetails
          nft={{ objectId: activeNft.objectId, type: activeNft.type, display: { data: activeNft.display?.output ?? null } }}
          toggleModal={toggleModal}
        />
      )}
      {activeKiosk && <KioskDetails kiosk={activeKiosk} toggleModal={toggleKioskModal} />}
    </>
  )
}
