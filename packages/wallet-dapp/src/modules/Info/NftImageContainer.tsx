import { useCallback, useState } from 'react'
import styled from 'styled-components'

import { IconNftPlaceholder } from 'components/Icons/IconNftPlaceholder'
import Typography from 'components/Typography'
import { ellipsizeTokenAddress } from 'utils/helpers'
import Spinner from 'components/Spinner'

export const EmptyPlaceholder = styled.div<{ width?: number; height?: number; showImgInfoOnHover?: boolean }>`
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

export const PlaceholderWrapper = styled.div`
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

const NftTextOverflow = styled.div`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const KioskImage = styled.img`
  width: 56px;
  height: 56px;
  border-radius: 4px;
`

const KioskSpinner = styled(Spinner)`
  margin-top: 0px;
  margin-left: 0px;
  width: 24px;
  height: 24px;
  border-width: 2px;
`

interface NftImageProps {
  objectId?: string
  imgSrc?: string
  name?: string
  onClick?: () => void
  imgWidth?: number
  imgHeight?: number
  showImgInfoOnHover?: boolean
}

interface NftImageContainerProps {
  type: string
  address: string
  objectId?: string
  imgSrc?: string
  name?: string
  toggleModal?: () => void
  imgWidth?: number
  imgHeight?: number
  noDisplayData: boolean
  showImgInfoOnHover?: boolean
}

const NftImage = ({ objectId, imgSrc, name, onClick, imgWidth, imgHeight, showImgInfoOnHover }: NftImageProps) => {
  const [showPlaceholder, setShowPlaceholder] = useState(!imgSrc)
  const [isLoading, setIsLoading] = useState(!!imgSrc)

  const handleImageLoaded = useCallback(() => {
    setIsLoading(false)
  }, [])

  const handleImageLoadError = useCallback(() => {
    setIsLoading(false)
    setShowPlaceholder(true)
  }, [])

  return (
    <div key={objectId} onClick={isLoading ? undefined : onClick}>
      {isLoading && !showPlaceholder && (
        <EmptyPlaceholder width={imgWidth} height={imgHeight}>
          <Spinner style={{ marginTop: 0, marginLeft: 0 }} />
        </EmptyPlaceholder>
      )}
      {showPlaceholder && (
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
      )}
      <ImgWrapper>
        <StyledNftImage
          onLoad={handleImageLoaded}
          onError={handleImageLoadError}
          src={imgSrc}
          width={imgWidth}
          height={imgHeight}
          showImgInfoOnHover={showImgInfoOnHover}
          style={{ display: isLoading || showPlaceholder ? 'none' : 'block' }}
        />
        {name && showImgInfoOnHover ? (
          <NftName variant="caption" className="hide">
            {name}
          </NftName>
        ) : null}
      </ImgWrapper>
    </div>
  )
}

export const NftImageContainer = ({
  objectId,
  imgSrc,
  name,
  type,
  address,
  toggleModal,
  imgWidth,
  imgHeight,
  showImgInfoOnHover,
  noDisplayData,
}: NftImageContainerProps) => {
  if (noDisplayData) {
    return (
      <div onClick={toggleModal}>
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
      imgSrc={imgSrc}
      name={name}
      objectId={objectId}
      onClick={toggleModal}
      imgWidth={imgWidth}
      imgHeight={imgHeight}
      showImgInfoOnHover={showImgInfoOnHover}
    />
  )
}

export const KioskSmallImageWithLoader = ({ imgSrc, index }: { index: number; imgSrc?: string }) => {
  const [showPlaceholder, setShowPlaceholder] = useState(!imgSrc)
  const [isLoading, setIsLoading] = useState(!!imgSrc)

  const handleImageLoaded = useCallback(() => {
    setIsLoading(false)
  }, [])

  const handleImageLoadError = useCallback(() => {
    setIsLoading(false)
    setShowPlaceholder(true)
  }, [])

  return (
    <>
      {isLoading && !showPlaceholder && (
        <EmptyPlaceholder width={56} height={56}>
          <KioskSpinner style={{ marginTop: 0, marginLeft: 0, width: 24, height: 24 }} />
        </EmptyPlaceholder>
      )}
      {showPlaceholder && (
        <EmptyPlaceholder width={56} height={56}>
          <PlaceholderWrapper>
            <IconNftPlaceholder />
          </PlaceholderWrapper>
        </EmptyPlaceholder>
      )}
      <KioskImage
        src={imgSrc}
        style={
          index > 1
            ? { marginTop: 5, display: isLoading || showPlaceholder ? 'none' : 'block' }
            : { display: isLoading || showPlaceholder ? 'none' : 'block' }
        }
        onLoad={handleImageLoaded}
        onError={handleImageLoadError}
      />
    </>
  )
}
