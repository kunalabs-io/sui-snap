import { SuiObjectResponse } from '@mysten/sui.js/client'
import styled, { useTheme } from 'styled-components'

import Modal from 'components/Modal'
import ModalBody from 'components/Modal/components/ModalBody'
import { IconClose } from 'components/Icons/IconClose'
import { NftImageContainer } from './NftImageContainer'
import { useNetwork } from 'utils/useNetworkProvider'
import { IconLink } from 'components/Icons/IconLink'
import Typography from 'components/Typography'
import { ellipsizeTokenAddress } from 'utils/helpers'

interface Props {
  toggleModal: () => void
  nft: SuiObjectResponse
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

const ViewExplorerLabel = styled(Typography)`
  text-transform: uppercase;
  color: ${p => p.theme.colors.text.alternative};
`

const ExplorerLink = styled.a`
  text-decoration: none;
  display: flex;
  justify-content: center;
  margin-top: 12px;
  align-items: center;
  & > svg {
    margin-left: 4px;
  }
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
  color: ${p => p.theme.colors.text.alternative};
`

export const NftDetails = ({ nft, toggleModal }: Props) => {
  const { network } = useNetwork()
  const theme = useTheme()

  const objectId = nft.data?.objectId || ''

  const handleClose = () => {
    toggleModal()
  }

  const name = nft.data?.display?.data?.['name' as keyof typeof nft.data.display.data] as string
  const description = nft.data?.display?.data?.['description' as keyof typeof nft.data.display.data] as string
  const link = nft.data?.display?.data?.['link' as keyof typeof nft.data.display.data] as string
  const projectUrl = nft.data?.display?.data?.['project_url' as keyof typeof nft.data.display.data] as string
  const creator = nft.data?.display?.data?.['creator' as keyof typeof nft.data.display.data] as string

  const imgSrc = nft.data?.display?.data?.['image_url' as keyof typeof nft.data.display.data] as string
  const noDisplayData = nft.data?.display?.data === null
  const type = nft.data?.type || ''
  const address = nft.data?.objectId || ''

  return (
    <Modal onClose={handleClose} style={{ padding: 20, maxHeight: 450 }}>
      <ModalBody>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <NftImageContainer
            type={type}
            address={address}
            imgSrc={imgSrc}
            name={name}
            objectId={objectId}
            imgHeight={200}
            imgWidth={200}
            noDisplayData={noDisplayData}
          />
        </div>
        <IconSection onClick={handleClose}>
          <IconClose />
        </IconSection>
        <ExplorerLink
          href={`https://suiexplorer.com/object/${objectId}?network=${network}`}
          target="_blank"
          rel="noreferrer"
          style={{ textDecoration: 'none' }}
        >
          <ViewExplorerLabel variant="caption">View on explorer</ViewExplorerLabel>
          <IconLink stroke={theme.colors.text.alternative} />
        </ExplorerLink>
        <DetailsContainer>
          <DetailsLabel variant="caption" fontWeight="bold" style={{ marginRight: 16 }}>
            Details
          </DetailsLabel>
          <HrLine />
        </DetailsContainer>
        {<div style={{ height: 24 }} />}
        {name && (
          <InfoContainer>
            <Typography variant="description" fontWeight="medium" color="secondary">
              Name
            </Typography>
            <InfoValue variant="description" fontWeight="medium" color="secondary">
              {name}
            </InfoValue>
          </InfoContainer>
        )}
        {description && (
          <InfoContainer>
            <Typography variant="description" fontWeight="medium" color="secondary">
              Description
            </Typography>
            <InfoValue variant="description" fontWeight="medium" color="secondary">
              {description}
            </InfoValue>
          </InfoContainer>
        )}
        {link && (
          <InfoContainer>
            <Typography variant="description" fontWeight="medium" color="secondary">
              Link
            </Typography>
            <InfoValue variant="description" fontWeight="medium" color="secondary">
              <InfoValueLink href={link} target="_blank" rel="noreferrer">
                {link}
              </InfoValueLink>
            </InfoValue>
          </InfoContainer>
        )}
        {projectUrl && (
          <InfoContainer>
            <Typography variant="description" fontWeight="medium" color="secondary">
              Project
            </Typography>
            <InfoValue variant="description" fontWeight="medium" color="secondary">
              <InfoValueLink href={projectUrl} target="_blank" rel="noreferrer">
                {projectUrl}
              </InfoValueLink>
            </InfoValue>
          </InfoContainer>
        )}
        {creator && (
          <InfoContainer>
            <Typography variant="description" fontWeight="medium" color="secondary">
              Creator
            </Typography>
            <InfoValue variant="description" fontWeight="medium" color="secondary">
              {creator}
            </InfoValue>
          </InfoContainer>
        )}
        {noDisplayData && (
          <InfoContainer>
            <Typography variant="description" fontWeight="medium" color="secondary">
              Type
            </Typography>
            <InfoValue
              variant="description"
              fontWeight="medium"
              color="secondary"
              style={{ maxWidth: 300, wordBreak: 'break-word', whiteSpace: 'normal' }}
            >
              {`${ellipsizeTokenAddress(address)}${type.substring(type.indexOf('::'))}`}
            </InfoValue>
          </InfoContainer>
        )}
      </ModalBody>
    </Modal>
  )
}
