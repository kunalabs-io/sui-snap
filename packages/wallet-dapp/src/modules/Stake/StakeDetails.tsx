import styled from 'styled-components'

import { IconBack } from 'components/Icons/IconBack'
import okxearn from './okxearn.png'
import Typography from 'components/Typography'
import Button from 'components/Button'

const Container = styled.div`
  padding-top: 16px;
  padding-left: 24px;
  padding-right: 24px;
`

const IconContainer = styled.div`
  cursor: pointer;
  display: flex;
`

const ImgContainer = styled.div`
  margin: 24px 0;
  text-align: center;
`

const Title = styled(Typography)`
  color: ${p => p.theme.colors.text.description};
`

const StakingInfoContent = styled.div`
  display: flex;
  margin-bottom: 24px;
  border: 1px solid #bbc0c5;
  border-radius: 13px;
  & > div {
    flex: 1;
    overflow: auto;
    padding: 16px;
    text-align: center;
    text-transform: uppercase;
    &:first-child {
      border-right: 1px solid #bbc0c5;
    }
  }
`

const StakingInfoSubtitle = styled(Typography)`
  color: ${p => p.theme.colors.text.alternative};
  margin-bottom: 8px;
`

const StakeValue = styled(Typography)<{ earned?: boolean }>`
  color: ${p => (p.earned ? p.theme.colors.text.success : p.theme.colors.text.alternative)};
  font-size: 18px;
  overflow: hidden;
  text-overflow: ellipsis;
`

const StakeToken = styled(Typography)<{ earned?: boolean }>`
  font-size: 13px;
  color: ${p => (p.earned ? p.theme.colors.text.success : '#bbc0c5')};
  margin-left: 6px;
`

const UnstakeButton = styled(Button)`
  height: 34px;
  width: 100%;
  font-size: 14px;
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

const DetailsInfoContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
`

const DetailsInfoLabel = styled(Typography)`
  color: ${p => p.theme.colors.text.secondary};
`

const DetailsInfoValue = styled(Typography)`
  color: ${p => p.theme.colors.text.alternative};
`

interface Props {
  onBackClick: () => void
}

export const StakeDetails = ({ onBackClick }: Props) => {
  return (
    <Container>
      <IconContainer onClick={onBackClick}>
        <IconBack />
      </IconContainer>
      <ImgContainer>
        <img src={okxearn} width={58} height={17} />
        <Title variant="description" fontWeight="bold">
          OKXEarn
        </Title>
      </ImgContainer>
      <StakingInfoContent>
        <div>
          <StakingInfoSubtitle variant="caption" fontWeight="bold">
            Your stake
          </StakingInfoSubtitle>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <StakeValue variant="caption" fontWeight="bold" style={{ marginBottom: 0 }}>
              19
            </StakeValue>
            <StakeToken fontWeight="medium">SUI</StakeToken>
          </div>
        </div>
        <div>
          <StakingInfoSubtitle variant="caption" fontWeight="bold">
            Earned
          </StakingInfoSubtitle>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <StakeValue variant="caption" fontWeight="bold" style={{ marginBottom: 0 }} earned>
              5.02930
            </StakeValue>
            <StakeToken earned fontWeight="medium">
              SUI
            </StakeToken>
          </div>
        </div>
      </StakingInfoContent>
      <UnstakeButton variant="outlined">Unstake and Collect Earned</UnstakeButton>
      <DetailsContainer>
        <DetailsLabel variant="caption" fontWeight="bold" style={{ marginRight: 16 }}>
          Details
        </DetailsLabel>
        <HrLine />
      </DetailsContainer>
      {<div style={{ height: 16 }} />}
      <DetailsInfoContainer>
        <DetailsInfoLabel fontWeight="bold" variant="description">
          APY
        </DetailsInfoLabel>
        <DetailsInfoValue fontWeight="bold" variant="description">
          4.43%
        </DetailsInfoValue>
      </DetailsInfoContainer>
      <DetailsInfoContainer>
        <DetailsInfoLabel fontWeight="bold" variant="description">
          Commission
        </DetailsInfoLabel>
        <DetailsInfoValue fontWeight="bold" variant="description">
          8%
        </DetailsInfoValue>
      </DetailsInfoContainer>
    </Container>
  )
}
