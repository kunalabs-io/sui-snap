import { useCallback, useEffect, useState } from 'react'
import styled from 'styled-components'
import { SuiObjectResponse } from '@mysten/sui.js/client'

import { IconNftPlaceholder } from 'components/Icons/IconNftPlaceholder'
import Spinner from 'components/Spinner'
import { useOwnedObjects } from 'utils/useOwnedObjects'
import Typography from 'components/Typography'
import { ellipsizeTokenAddress } from 'utils/helpers'
import { WALLET_BALANCES_REFETCH_INTERVAL } from 'utils/const'
import { NftDetails } from './NftDetails'
import { Kiosk as KioskType, useGetKioskContents } from 'utils/useGetKioskContents'
import { Kiosk } from './Kiosk'
import { KioskDetails } from './KioskDetails'

const Container = styled.div<{ isScrollable: boolean }>`
  padding-top: 16px;
  padding-left: 24px;
  padding-right: 24px;
  display: flex;
  ${p => (p.isScrollable ? `flex-wrap: wrap; gap: 8px` : `justify-content: space-between`)}
`

const EmptyPlaceholder = styled.div<{ width?: number; height?: number; showImgInfoOnHover?: boolean }>`
  width: ${p => p.width || 144}px;
  height: ${p => p.height || 144}px;
  border-radius: 13px;
  background: #f2f4f6;
  display: flex;
  justify-content: center;
  align-items: center;
  ${p => p.showImgInfoOnHover && `cursor: pointer;`}
  position: relative;

  .showName {
    display: block;
    position: absolute;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`

const PlaceholderWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  .hide {
    display: none;
  }
`

const StyledNftImage = styled.img<{ width?: number; height?: number; showImgInfoOnHover?: boolean }>`
  width: ${p => p.width || 144}px;
  height: ${p => p.height || 144}px;
  border-radius: 13px;
  ${p => p.showImgInfoOnHover && `cursor: pointer;`}

  &:hover + .hide {
    display: block;
    position: absolute;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`

const ImgWrapper = styled.div`
  display: flex;
  position: relative;
  .hide {
    display: none;
  }
`

const NftName = styled(Typography)`
  background-color: rgba(255, 255, 255, 0.95);
  border: 1px solid #d6d9dc;
  padding: 4px;
  border-radius: 4px;
  width: 110px;
  left: 50%;
  transform: translateX(-50%);
  bottom: 16px;
  text-align: center;
`

const NftType = styled(Typography)`
  width: 110px;
  left: 50%;
  transform: translateX(-50%);
  bottom: 16px;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  top: inherit !important;
  display: block;
  position: absolute;
`

const LoadMore = styled.div`
  text-align: center;
  padding: 16px;
  cursor: pointer;
  color: ${p => p.theme.colors.button.primary};
`

const NftTextOverflow = styled.div`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const EmptyList = styled.div`
  padding: 24px;
  text-align: center;
  color: ${p => p.theme.colors.text.secondary};
`

interface NftImageProps {
  nft: SuiObjectResponse
  onClick?: (o?: SuiObjectResponse) => void
  imgWidth?: number
  imgHeight?: number
  showImgInfoOnHover?: boolean
}

interface NftImageContainerProps {
  nft: SuiObjectResponse
  toggleModal?: (o?: SuiObjectResponse) => void
  imgWidth?: number
  imgHeight?: number
  showImgInfoOnHover?: boolean
}

const NftImage = ({ nft, onClick, imgWidth, imgHeight, showImgInfoOnHover }: NftImageProps) => {
  const [showPlaceholder, setShowPlaceholder] = useState(false)

  const imgSrc = nft.data?.display?.data?.['image_url' as keyof typeof nft.data.display.data] as string
  const name = nft.data?.display?.data?.['name' as keyof typeof nft.data.display.data] as string

  useEffect(() => setShowPlaceholder(!imgSrc), [imgSrc])

  const handleImageLoaded = useCallback(() => setShowPlaceholder(false), [])

  const handleImageLoadError = useCallback(() => setShowPlaceholder(true), [])

  return (
    <div key={nft?.data?.objectId} onClick={() => onClick?.(nft)}>
      {showPlaceholder ? (
        <EmptyPlaceholder width={imgWidth} height={imgHeight} showImgInfoOnHover={showImgInfoOnHover}>
          <PlaceholderWrapper>
            <IconNftPlaceholder />
          </PlaceholderWrapper>
          {name && showImgInfoOnHover ? (
            <NftName variant="caption" className="showName">
              {name}
            </NftName>
          ) : null}
        </EmptyPlaceholder>
      ) : (
        <ImgWrapper>
          <StyledNftImage
            onLoad={handleImageLoaded}
            onError={handleImageLoadError}
            src={imgSrc}
            width={imgWidth}
            height={imgHeight}
            showImgInfoOnHover={showImgInfoOnHover}
          />
          {name && showImgInfoOnHover ? (
            <NftName variant="caption" className="hide">
              {name}
            </NftName>
          ) : null}
        </ImgWrapper>
      )}
    </div>
  )
}

export const NftImageContainer = ({
  nft,
  toggleModal,
  imgWidth,
  imgHeight,
  showImgInfoOnHover,
}: NftImageContainerProps) => {
  const type = nft.data?.type || ''
  const address = nft.data?.objectId || ''
  if (nft.data?.display?.data === null) {
    return (
      <div key={nft.data?.objectId} onClick={() => toggleModal?.(nft)}>
        <EmptyPlaceholder width={imgWidth} height={imgHeight} showImgInfoOnHover={showImgInfoOnHover}>
          <PlaceholderWrapper>
            <IconNftPlaceholder />
          </PlaceholderWrapper>
          <NftType variant="caption">
            <NftTextOverflow>{ellipsizeTokenAddress(address)}</NftTextOverflow>
            <NftTextOverflow>{type.substring(type.indexOf('::'))}</NftTextOverflow>
          </NftType>
        </EmptyPlaceholder>
      </div>
    )
  }

  return (
    <NftImage
      key={nft.data?.objectId}
      nft={nft}
      onClick={toggleModal}
      imgWidth={imgWidth}
      imgHeight={imgHeight}
      showImgInfoOnHover={showImgInfoOnHover}
    />
  )
}

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

          return (
            <NftImageContainer key={o.data?.objectId} toggleModal={toggleModal} nft={o} showImgInfoOnHover={true} />
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
      {activeNft && <NftDetails nft={activeNft} toggleModal={toggleModal} />}
      {activeKiosk && <KioskDetails kiosk={activeKiosk} toggleModal={toggleKioskModal} />}
    </>
  )
}
