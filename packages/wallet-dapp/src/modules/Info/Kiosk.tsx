import styled from 'styled-components'

import Typography from 'components/Typography'
import { Kiosk as KioskType } from 'utils/useGetKioskContents'
import { formatImgUrl } from 'utils/images'
import { KioskSmallImageWithLoader } from './NftImageContainer'

const KioskWrapper = styled.div`
  padding: 10px;
  width: 124px;
  height: 124px;
  border-radius: 13px;
  background: #f2f4f6;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 8px;
  cursor: pointer;
`

const RemainingImagesContainer = styled.div`
  width: 52px;
  height: 52px;
  background-color: #d9d9d987;
  border-radius: 4px;
  margin-right: 4px;
`

const RemainingImagesContainerNum = styled.div`
  position: absolute;
  background: #d9d9d9;
  width: 52px;
  height: 52px;
  top: 4px;
  left: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
`

const ImagesNumLabel = styled(Typography)`
  color: ${p => p.theme.colors.text.alternative};
`

const SHOW_IMG_NUM = 3

export const Kiosk = ({ kiosk, toggleModal }: { kiosk: KioskType; toggleModal: (kiosk: KioskType) => void }) => {
  const kioskImages = kiosk.items.map(i => i.data?.display?.data?.image_url)

  return (
    <KioskWrapper onClick={() => toggleModal(kiosk)}>
      {kioskImages.slice(0, SHOW_IMG_NUM).map((img, index) => (
        <KioskSmallImageWithLoader key={img} imgSrc={formatImgUrl(img)} index={index} />
      ))}
      {kioskImages.length > SHOW_IMG_NUM && (
        <div style={{ position: 'relative', marginTop: kioskImages.length > 2 ? 5 : 0 }}>
          <RemainingImagesContainer />
          <RemainingImagesContainerNum>
            <ImagesNumLabel variant="caption">{`+${kioskImages.length - 3}`}</ImagesNumLabel>{' '}
          </RemainingImagesContainerNum>
        </div>
      )}
    </KioskWrapper>
  )
}
