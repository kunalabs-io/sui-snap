import styled from 'styled-components'
import { useCallback, useState } from 'react'

import Button from 'components/Button'
import { IconBack } from 'components/Icons/IconBack'
import Typography from 'components/Typography'
import okxEarn from './okxearn.png'
import { StakeDetails } from './StakeDetails'
import { NewStake } from './NewStake'

const Container = styled.div`
  padding-top: 16px;
  padding-left: 24px;
  padding-right: 24px;
`

const IconContainer = styled.div`
  cursor: pointer;
  display: flex;
`

const StyledButton = styled(Button)`
  font-size: 14px;
  width: 100%;
  height: 34px;
`

const StakingInfoContainer = styled.div`
  border: 1px solid #bbc0c5;
  border-radius: 13px;
`

const StakingInfoTitle = styled(Typography)`
  background: #f2f4f6;
  text-align: center;
  border-radius: 13px 13px 0px 0px;
  padding: 10px 0;
  color: ${p => p.theme.colors.text.alternative};
  border-bottom: 1px solid #bbc0c5;
  text-transform: uppercase;
`

const StakingInfoContent = styled.div`
  display: flex;
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

const StakingContainer = styled.div<{ isScrollable?: boolean }>`
  margin-top: 16px;
  display: flex;
  ${p => (p.isScrollable ? `flex-wrap: wrap; gap: 8px` : `justify-content: space-between`)}
`

const StakingItem = styled.div`
  width: 120px;
  height: 120px;
  border: 1px solid #bbc0c5;
  border-radius: 13px;
  padding: 12px;
  cursor: pointer;
  &:hover {
    background-color: #fafbfc;
  }
`

const EarnName = styled(Typography)`
  color: #494d52;
`

const EarnValue = styled(Typography)`
  font-size: 15px;
  color: #494d52;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const RewardsLabel = styled(Typography)`
  color: ${p => p.theme.colors.text.secondary};
  margin-bottom: 2px;
`

const RewardsValue = styled(Typography)`
  color: ${p => p.theme.colors.text.success};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

interface Props {
  onBackClick: () => void
}

export const Stake = ({ onBackClick }: Props) => {
  const [activeStakeScreen, setActiveStakeScreen] = useState<'stake' | 'new-stake' | 'stake-details'>('stake')

  const handleNewStakeClick = useCallback(() => {
    setActiveStakeScreen('new-stake')
  }, [])

  const handleStakeDetailsClick = useCallback(() => {
    setActiveStakeScreen('stake-details')
  }, [])

  const handleStakeBack = useCallback(() => {
    setActiveStakeScreen('stake')
  }, [])

  const stakingItems = 2
  if (activeStakeScreen === 'new-stake') {
    return <NewStake />
  }

  if (activeStakeScreen === 'stake-details') {
    return <StakeDetails onBackClick={handleStakeBack} />
  }

  return (
    <Container>
      <IconContainer onClick={onBackClick}>
        <IconBack />
      </IconContainer>
      <div style={{ height: 16 }} />
      <StyledButton onClick={handleNewStakeClick}>+ Stake SUI</StyledButton>
      <div style={{ height: 16 }} />
      <StakingInfoContainer>
        <StakingInfoTitle variant="caption" fontWeight="bold">
          STAKING ON 1 VALIDATOR
        </StakingInfoTitle>
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
      </StakingInfoContainer>
      <StakingContainer isScrollable={stakingItems > 2}>
        {Array.from(Array(stakingItems).keys()).map(item => (
          <StakingItem key={item} onClick={handleStakeDetailsClick}>
            <img src={okxEarn} />
            <EarnName variant="body" fontWeight="medium" style={{ marginTop: 4 }}>
              OKXEarn
            </EarnName>
            <div style={{ display: 'flex', alignItems: 'center', margin: '12px 0' }}>
              <EarnValue fontWeight="medium">1.05</EarnValue>
              <StakeToken>SUI</StakeToken>
            </div>
            <RewardsLabel variant="caption" fontWeight="bold">
              Staking Rewards
            </RewardsLabel>
            <RewardsValue variant="body" fontWeight="medium">
              5.029305928 SUI
            </RewardsValue>
            {/* <RewardsLabel variant="caption" fontWeight="bold">
              Starts earning in 20 hours 50 mins
            </RewardsLabel> */}
          </StakingItem>
        ))}
      </StakingContainer>
    </Container>
  )
}
