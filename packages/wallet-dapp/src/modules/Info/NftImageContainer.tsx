import { useCallback, useEffect, useState } from 'react'
import styled from 'styled-components'

import { IconNftPlaceholder } from 'components/Icons/IconNftPlaceholder'
import Typography from 'components/Typography'
import { ellipsizeTokenAddress } from 'utils/helpers'

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

const NftTextOverflow = styled.div`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
  const [showPlaceholder, setShowPlaceholder] = useState(false)

  useEffect(() => setShowPlaceholder(!imgSrc), [imgSrc])

  const handleImageLoaded = useCallback(() => setShowPlaceholder(false), [])

  const handleImageLoadError = useCallback(() => setShowPlaceholder(true), [])

  return (
    <div key={objectId} onClick={onClick}>
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
