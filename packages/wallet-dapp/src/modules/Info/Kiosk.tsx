import { KioskData } from '@mysten/kiosk'
import styled from 'styled-components'

import Typography from 'components/Typography'

const KioskWrapper = styled.div<{ width?: number; height?: number; showImgInfoOnHover?: boolean }>`
  padding: 8px;
  width: ${p => p.width || 126}px;
  height: ${p => p.height || 126}px;
  border-radius: 13px;
  background: #f2f4f6;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 8px;
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

const KioskImage = styled.img`
  width: 56px;
  height: 56px;
  border-radius: 4px;
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

export const Kiosk = ({
  kiosk,
  showImgInfoOnHover,
  toggleModal,
}: {
  kiosk: KioskData
  showImgInfoOnHover?: boolean
  toggleModal: (kiosk: KioskData) => void
}) => {
  const kioskImages = kiosk.items.map(i => i.data?.display?.data?.image_url)

  return (
    <KioskWrapper showImgInfoOnHover={showImgInfoOnHover} onClick={() => toggleModal(kiosk)}>
      {kioskImages.slice(0, SHOW_IMG_NUM).map((img, index) => (
        <KioskImage key={img} src={img} style={index > 1 ? { marginTop: 5 } : {}} />
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
