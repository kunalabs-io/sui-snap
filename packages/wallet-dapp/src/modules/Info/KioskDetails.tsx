import { useState } from 'react'
import { KioskItem } from '@mysten/kiosk'
import styled from 'styled-components'

import Modal from 'components/Modal'
import ModalBody from 'components/Modal/components/ModalBody'
import { IconClose } from 'components/Icons/IconClose'
import Typography from 'components/Typography'
import { ellipsizeTokenAddress } from 'utils/helpers'
import { useNetwork } from 'utils/useNetworkProvider'
import { IconLink } from 'components/Icons/IconLink'
import { Kiosk as KioskType } from 'utils/useGetKioskContents'
import { NftImageContainer } from './NftImageContainer'
import { formatImgUrl } from 'utils/images'
import { NftDetails } from './NftDetails'

interface Props {
  toggleModal: () => void
  kiosk: KioskType
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
  gap: 8px;
  margin-top: 32px;
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

export const KioskDetails = ({ kiosk, toggleModal }: Props) => {
  const [activeKioskItem, setActiveKioskItem] = useState<KioskItem>()
  const { network } = useNetwork()

  const handleClose = () => {
    if (!activeKioskItem) {
      toggleModal()
    }
  }

  const kioskImages = kiosk.items.map(i => i.data?.display?.data?.image_url)

  return (
    <>
      <Modal onClose={handleClose} style={{ padding: 20, maxHeight: 450, overflowY: 'auto', width: 464 }}>
        <ModalBody style={{ overflowY: 'initial' }}>
          <IconSection onClick={handleClose}>
            <IconClose />
          </IconSection>
          <ImagesContainer>
            {kiosk.items.map(k => {
              const type = k.data?.type || ''
              const address = k.data?.objectId || ''
              const imgSrc = k.data?.display?.data?.['image_url' as keyof typeof k.data.display.data]
              const name = k.data?.display?.data?.['name' as keyof typeof k.data.display.data]
              const objectId = k?.data?.objectId
              return (
                <div key={objectId} onClick={() => setActiveKioskItem(k)}>
                  <NftImageContainer
                    key={objectId}
                    type={type}
                    address={address}
                    imgSrc={formatImgUrl(imgSrc)}
                    name={name}
                    objectId={objectId}
                    showImgInfoOnHover={true}
                    noDisplayData={k.data?.display?.data === null}
                  />
                </div>
              )
            })}
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
                href={`https://suivision.xyz/object/${kiosk.kioskId}?network=${network}`}
                target="_blank"
                rel="noreferrer"
              >
                {ellipsizeTokenAddress(kiosk.kioskId || '')}
                <IconLink />
              </InfoValueLink>
            </InfoValue>
          </InfoContainer>
        </ModalBody>
      </Modal>
      {activeKioskItem && <NftDetails nft={activeKioskItem.data} toggleModal={() => setActiveKioskItem(undefined)} />}
    </>
  )
}
