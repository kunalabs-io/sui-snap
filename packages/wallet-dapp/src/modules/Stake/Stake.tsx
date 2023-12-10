import styled from 'styled-components'
import { useCallback, useState } from 'react'

import Button from 'components/Button'
import { IconBack } from 'components/Icons/IconBack'
import Typography from 'components/Typography'
import { StakeDetails } from './StakeDetails'
import { NewStake } from './NewStake'
import { Amount } from 'lib/amount'
import useStakes from 'utils/useStakes'
import useLatestSuiSystemState from 'utils/useLatestSuiSystemState'
import { SUI_DECIMALS } from '@mysten/sui.js/utils'
import { formatNumberWithCommas } from 'utils/formatting'
import ImageWithFallback from 'components/ImageWithFallback'
import { formatTimeDifference } from 'utils/helpers'
import Spinner from 'components/Spinner'

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
`

const StakeToken = styled(Typography)<{ earned?: boolean }>`
  font-size: 13px;
  color: ${p => (p.earned ? p.theme.colors.text.success : '#bbc0c5')};
  margin-left: 6px;
`

const StakingContainer = styled.div<{ isScrollable?: boolean }>`
  margin-top: 16px;
  display: flex;
  ${p => (p.isScrollable ? `flex-wrap: wrap; gap: 12px` : `justify-content: space-between`)}
`

const StakingItem = styled.div`
  width: 116px;
  height: 116px;
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

export const CustomPlaceholder = styled.div`
  width: 27px;
  height: 27px;
  background-color: ${p => p.theme.colors.button.primary};
  border-radius: 4px;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  text-transform: uppercase;
`

const RewardsLabel = styled(Typography)`
  color: ${p => p.theme.colors.text.secondary};
  margin-bottom: 2px;
`

const RewardsValue = styled(Typography)<{ earned?: boolean }>`
  color: ${p => (p.earned ? p.theme.colors.text.success : p.theme.colors.text.secondary)};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

interface Props {
  onBackClick: () => void
}

export interface ValidatorInfo {
  address: string
  poolId: string
  name: string
  apy?: number
  imageUrl: string
  totalSuiStaked: Amount
  votingPower: number
  commission: number
}

export interface StakeItem {
  id: string
  validatorAddress: string
  validator?: {
    address: string
    name: string
    imgUrl: string
    apy?: number
    commission: number
  }
  principal: Amount
  status: 'Pending' | 'Active'
  startedEarning: boolean
  rewardsStart?: Date
  estimatedReward?: Amount
}

export const Stake = ({ onBackClick }: Props) => {
  const [activeStakeScreen, setActiveStakeScreen] = useState<'stake' | 'new-stake' | 'stake-details'>('stake')

  const stakesRes = useStakes()
  const systemStateRes = useLatestSuiSystemState()

  const stakes: StakeItem[] = []
  if (stakesRes.data && systemStateRes.data) {
    for (const validator of stakesRes.data) {
      for (const stake of validator.stakes) {
        const validatorInfo = systemStateRes.data.systemState.activeValidators.find(
          v => v.suiAddress === validator.validatorAddress
        )

        if (stake.status === 'Unstaked') {
          continue
        }

        const startedEarning = Number(stake.stakeActiveEpoch) < Number(systemStateRes.data.systemState.epoch)

        const currentEpoch = Number(systemStateRes.data.systemState.epoch)
        const stakeRequestEpoch = Number(stake.stakeRequestEpoch)
        let rewardsStart: Date | undefined
        if (!startedEarning) {
          rewardsStart = new Date(
            Number(systemStateRes.data.systemState.epochStartTimestampMs) +
              (stakeRequestEpoch - currentEpoch + 2) * Number(systemStateRes.data.systemState.epochDurationMs)
          )
        }

        stakes.push({
          id: stake.stakedSuiId,
          validatorAddress: validator.validatorAddress,
          validator: validatorInfo
            ? {
                address: validatorInfo.suiAddress,
                name: validatorInfo.name,
                imgUrl: validatorInfo.imageUrl,
                apy: systemStateRes.data?.apyMap.get(validatorInfo.suiAddress),
                commission: Number(validatorInfo.commissionRate) / 100_00,
              }
            : undefined,
          principal: Amount.fromInt(BigInt(stake.principal), SUI_DECIMALS),
          status: stake.status,
          startedEarning,
          rewardsStart,
          estimatedReward:
            ('estimatedReward' in stake && Amount.fromInt(BigInt(stake.estimatedReward), SUI_DECIMALS)) || undefined,
        })
      }
    }
  }

  const summary = {
    numValidators: stakes.reduce((acc, stake) => {
      acc.add(stake.validatorAddress)
      return acc
    }, new Set()).size,
    totalStake: Amount.fromInt(
      stakes.reduce((acc, stake) => acc + stake.principal.int, 0n),
      SUI_DECIMALS
    ),
    totalEarned: Amount.fromInt(
      stakes.reduce((acc, stake) => acc + (stake.estimatedReward?.int || 0n), 0n),
      SUI_DECIMALS
    ),
  }

  const [stakeDetailsItem, setStakeDetailsItem] = useState<StakeItem>()

  const handleNewStakeClick = useCallback(() => {
    setActiveStakeScreen('new-stake')
  }, [])

  const handleStakeDetailsClick = useCallback((stake: StakeItem) => {
    setStakeDetailsItem(stake)
    setActiveStakeScreen('stake-details')
  }, [])

  const openStakeScreen = useCallback(() => {
    setActiveStakeScreen('stake')
  }, [])

  if (activeStakeScreen === 'new-stake') {
    return <NewStake onBackClick={openStakeScreen} openStakeScreen={openStakeScreen} />
  }

  if (activeStakeScreen === 'stake-details' && stakeDetailsItem) {
    return <StakeDetails onBackClick={openStakeScreen} stake={stakeDetailsItem} openStakeScreen={openStakeScreen} />
  }

  if (stakesRes.isLoading || systemStateRes.isLoading) {
    return <Spinner />
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
          STAKING ON {summary.numValidators} VALIDATOR{summary.numValidators > 1 ? 'S' : ''}
        </StakingInfoTitle>
        <StakingInfoContent>
          <div>
            <StakingInfoSubtitle variant="caption" fontWeight="bold">
              Your stake
            </StakingInfoSubtitle>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <StakeValue variant="caption" fontWeight="bold" style={{ marginBottom: 0 }}>
                {formatNumberWithCommas(summary.totalStake.toString())}
              </StakeValue>
              <StakeToken fontWeight="medium">SUI</StakeToken>
            </div>
          </div>
          <div>
            <StakingInfoSubtitle variant="caption" fontWeight="bold">
              Earned
            </StakingInfoSubtitle>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <StakeValue
                variant="caption"
                fontWeight="bold"
                style={{ marginBottom: 0 }}
                earned={summary.totalEarned.int > 0n}
              >
                {formatNumberWithCommas(summary.totalEarned.toString())}
              </StakeValue>
              <StakeToken earned={summary.totalEarned.int > 0n} fontWeight="medium">
                SUI
              </StakeToken>
            </div>
          </div>
        </StakingInfoContent>
      </StakingInfoContainer>
      <StakingContainer isScrollable={stakes.length > 2}>
        {stakes.map(stake => (
          <StakingItem key={stake.id} onClick={() => handleStakeDetailsClick(stake)}>
            <ImageWithFallback
              src={stake.validator?.imgUrl}
              style={{ width: 27, height: 27 }}
              alt={stake.validator?.name || ''}
              isSmallPlaceholder
              customPlaceholder={<CustomPlaceholder>{stake.validator?.name.slice(0, 2)}</CustomPlaceholder>}
            />
            <EarnName variant="body" fontWeight="medium" style={{ marginTop: 4 }}>
              {stake.validator?.name || ''}
            </EarnName>
            <div style={{ display: 'flex', alignItems: 'center', margin: '12px 0' }}>
              <EarnValue fontWeight="medium">{formatNumberWithCommas(stake.principal.toString())}</EarnValue>
              <StakeToken>SUI</StakeToken>
            </div>
            {stake.status === 'Active' && stake.startedEarning && (
              <>
                <RewardsLabel variant="caption" fontWeight="bold">
                  Staking Rewards
                </RewardsLabel>
                <RewardsValue variant="caption" fontWeight="medium" earned={!!stake.estimatedReward?.int}>
                  {stake.estimatedReward && formatNumberWithCommas(stake.estimatedReward.toString())} SUI
                </RewardsValue>
              </>
            )}
            {stake.rewardsStart !== undefined && (
              <RewardsLabel variant="caption" fontWeight="bold">
                Starts earning in
                <br />
                {formatTimeDifference(new Date(), stake.rewardsStart)}
              </RewardsLabel>
            )}
          </StakingItem>
        ))}
      </StakingContainer>
    </Container>
  )
}
