import { useState } from 'react'
import styled from 'styled-components'
import { KioskData } from '@mysten/kiosk'

import Modal from 'components/Modal'
import ModalBody from 'components/Modal/components/ModalBody'
import { IconClose } from 'components/Icons/IconClose'
import { IconNftPlaceholder } from 'components/Icons/IconNftPlaceholder'
import Typography from 'components/Typography'
import { ellipsizeTokenAddress } from 'utils/helpers'
import { useNetwork } from 'utils/useNetworkProvider'
import { IconLink } from 'components/Icons/IconLink'

interface Props {
  toggleModal: () => void
  kiosk: KioskData
}

const IconSection = styled.div`
  position: absolute;
  right: 20px;
  top: 20px;
  & > svg {
    fill: ${p => p.theme.colors.text.description};
    cursor: pointer;
  }
`

const ImagesContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 32px;
`

const Image = styled.img`
  width: 89px;
  height: 89px;
  border-radius: 13px;
`

const EmptyPlaceholder = styled.div<{ width?: number; height?: number; showImgInfoOnHover?: boolean }>`
  width: 89px;
  height: 89px;
  border-radius: 13px;
  background: #f2f4f6;
  display: flex;
  justify-content: center;
  align-items: center;
`

const DetailsContainer = styled.div`
  margin-top: 24px;
  display: flex;
  align-items: center;
`

const DetailsLabel = styled(Typography)`
  text-transform: uppercase;
  color: ${p => p.theme.colors.text.alternative};
`

const HrLine = styled.div`
  width: 100%;
  border-bottom: 1px solid ${p => p.theme.colors.text.secondary};
`

const InfoContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
`

const InfoValue = styled(Typography)`
  color: ${p => p.theme.colors.text.alternative};
  max-width: 240px;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
`

const InfoValueLink = styled.a`
  text-decoration: none;
  color: ${p => p.theme.colors.button.primary};

  svg {
    margin-left: 4px;
  }
`

export const KioskImageWithFallback = ({ imageSrc }: { imageSrc?: string }) => {
  const [showPlaceholder, setShowPlaceholder] = useState(false)

  if (showPlaceholder) {
    return (
      <EmptyPlaceholder>
        <IconNftPlaceholder />
      </EmptyPlaceholder>
    )
  }
  return <Image src={imageSrc} onLoad={() => setShowPlaceholder(false)} onError={() => setShowPlaceholder(true)} />
}

export const KioskDetails = ({ kiosk, toggleModal }: Props) => {
  const { network } = useNetwork()

  const handleClose = () => {
    toggleModal()
  }

  const kioskImages = kiosk.items.map(i => i.data?.display?.data?.image_url)

  return (
    <Modal onClose={toggleModal} style={{ padding: 20, maxHeight: 450 }}>
      <ModalBody>
        <IconSection onClick={handleClose}>
          <IconClose />
        </IconSection>
        <ImagesContainer>
          {kioskImages.map(kImage => (
            <KioskImageWithFallback key={kImage} imageSrc={kImage} />
          ))}
        </ImagesContainer>
        <DetailsContainer>
          <DetailsLabel variant="caption" fontWeight="bold" style={{ marginRight: 16 }}>
            Details
          </DetailsLabel>
          <HrLine />
        </DetailsContainer>
        {<div style={{ height: 24 }} />}
        <InfoContainer>
          <Typography variant="description" fontWeight="medium" color="secondary">
            Number of items
          </Typography>
          <InfoValue variant="description" fontWeight="medium" color="secondary">
            {kioskImages.length}
          </InfoValue>
        </InfoContainer>
        <InfoContainer>
          <Typography variant="description" fontWeight="medium" color="secondary">
            Kiosk ID
          </Typography>
          <InfoValue variant="description" fontWeight="medium" color="secondary">
            <InfoValueLink
              href={`https://suiexplorer.com/object/${kiosk.kiosk?.id}?network=${network}`}
              target="_blank"
              rel="noreferrer"
            >
              {ellipsizeTokenAddress(kiosk.kiosk?.id || '')}
              <IconLink />
            </InfoValueLink>
          </InfoValue>
        </InfoContainer>
      </ModalBody>
    </Modal>
  )
}
