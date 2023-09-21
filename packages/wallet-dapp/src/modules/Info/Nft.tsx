import { useCallback, useEffect, useState } from 'react'
import styled from 'styled-components'

import { IconNftPlaceholder } from 'components/Icons/IconNftPlaceholder'
import Spinner from 'components/Spinner'
import { WALLET_BALANCES_REFETCH_INTERVAL } from 'utils/const'
import { useOwnedObjects } from 'utils/useOwnedObjects'
import Typography from 'components/Typography'
import { ellipsizeTokenAddress } from 'utils/helpers'

const Container = styled.div`
  padding-top: 16px;
  padding-left: 24px;
  padding-right: 24px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`

const EmptyPlaceholder = styled.div`
  width: 144px;
  height: 144px;
  border-radius: 13px;
  background: #f2f4f6;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  position: relative;
  .hide {
    display: none;
  }
  &:hover {
    & > {
      .hide {
        display: block;
        position: absolute;
        top: 30px;
      }
    }
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

const StyledNftImage = styled.img`
  width: 144px;
  height: 144px;
  border-radius: 13px;
  cursor: pointer;

  &:hover + .hide {
    display: block;
    position: absolute;
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
  padding: 4px 0;
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
`

const NftImage = ({ imgSrc, objectId, name }: { imgSrc?: string; objectId?: string; name?: string }) => {
  const [showPlaceholder, setShowPlaceholder] = useState(false)

  useEffect(() => setShowPlaceholder(!imgSrc), [imgSrc])

  const handleImageLoaded = useCallback(() => setShowPlaceholder(false), [])

  const handleImageLoadError = useCallback(() => setShowPlaceholder(true), [])

  return showPlaceholder ? (
    <EmptyPlaceholder key={objectId}>
      <PlaceholderWrapper>
        <IconNftPlaceholder />
      </PlaceholderWrapper>
      {name ? (
        <NftName variant="caption" className="hide">
          {name}
        </NftName>
      ) : null}
    </EmptyPlaceholder>
  ) : (
    <ImgWrapper>
      <StyledNftImage key={objectId} onLoad={handleImageLoaded} onError={handleImageLoadError} src={imgSrc} />
      {name ? (
        <NftName variant="caption" className="hide">
          {name}
        </NftName>
      ) : null}
    </ImgWrapper>
  )
}

export const Nft = () => {
  const { isLoading, ownedObjects } = useOwnedObjects({ refetchInterval: WALLET_BALANCES_REFETCH_INTERVAL })

  if (isLoading) {
    return <Spinner style={{ marginTop: 48 }} />
  }

  if (!ownedObjects) {
    return null
  }

  return (
    <Container>
      {ownedObjects.map(o => {
        if (o.data?.display?.data === null) {
          const type = o.data?.type || ''
          const address = type ? type.substring(0, type.indexOf('::')) : ''

          console.log(type.substring(type.indexOf('::')))
          return (
            <EmptyPlaceholder key={o.data?.objectId}>
              <PlaceholderWrapper>
                <IconNftPlaceholder />
              </PlaceholderWrapper>
              <NftType variant="caption" className="hide">
                <div>{ellipsizeTokenAddress(address)}</div>
                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {type.substring(type.indexOf('::'))}
                </div>
              </NftType>
            </EmptyPlaceholder>
          )
        }
        const imgUrl = o.data?.display?.data?.['image_url' as keyof typeof o.data.display.data] as string
        const name = o.data?.display?.data?.['name' as keyof typeof o.data.display.data] as string

        return <NftImage key={o.data?.objectId} objectId={o.data?.objectId} imgSrc={imgUrl} name={name} />
      })}
    </Container>
  )
}
