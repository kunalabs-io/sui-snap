import styled from 'styled-components'

import { IconBack } from 'components/Icons/IconBack'
import Typography from 'components/Typography'
import Button from 'components/Button'
import { StakeItem } from './Stake'
import { formatNumberToPct, formatNumberWithCommas } from 'utils/formatting'
import { formatTimeDifference } from 'utils/helpers'
import { useState } from 'react'
import { TransactionBlock } from '@mysten/sui.js/transactions'
import { SUI_SYSTEM_STATE_OBJECT_ID } from '@mysten/sui.js/utils'
import { toast } from 'react-toastify'
import { useWalletKit } from '@mysten/wallet-kit'
import { useNetwork } from 'utils/useNetworkProvider'
import { useQueryClient } from '@tanstack/react-query'
import { invalidateWalletBalances } from 'utils/useWalletBalances'
import { invalidateStakes } from 'utils/useStakes'
import { UserRejectionError } from '@kunalabs-io/sui-snap-wallet'

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
  stake: StakeItem
  openStakeScreen: () => void
}

export const StakeDetails = ({ onBackClick, stake, openStakeScreen }: Props) => {
  const queryClient = useQueryClient()

  const walletKit = useWalletKit()
  const { network, chain } = useNetwork()

  const [isSending, setIsSending] = useState(false)

  const handleUnstakeClick = async () => {
    setIsSending(true)

    const txb = new TransactionBlock()
    txb.moveCall({
      target: '0x3::sui_system::request_withdraw_stake',
      arguments: [
        txb.sharedObjectRef({
          objectId: SUI_SYSTEM_STATE_OBJECT_ID,
          initialSharedVersion: 1,
          mutable: true,
        }),
        txb.object(stake.id),
      ],
    })

    try {
      const res = await walletKit.signAndExecuteTransactionBlock({
        transactionBlock: txb,
        requestType: 'WaitForLocalExecution',
        chain,
      })

      const url = `https://suiexplorer.com/txblock/${res.digest}?network=${network}`
      toast.success(
        <div>
          Transaction succeeded:{' '}
          <a href={url} target="_blank" rel="noreferrer">
            {res.digest}
          </a>
        </div>
      )

      await Promise.all([invalidateWalletBalances(queryClient), invalidateStakes(queryClient)])
      setIsSending(false)
      openStakeScreen()
    } catch (e) {
      if (e instanceof UserRejectionError) {
        toast.warn('Transaction rejected')
        return
      }

      toast.error('Transaction failed')
      console.error(e)
      return
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Container>
      <IconContainer onClick={onBackClick}>
        <IconBack />
      </IconContainer>
      <ImgContainer>
        <img src={stake.validator?.imgUrl} width={40} />
        <Title variant="description" fontWeight="bold">
          {stake.validator?.name}
        </Title>
      </ImgContainer>
      <StakingInfoContent>
        <div>
          <StakingInfoSubtitle variant="caption" fontWeight="bold">
            Your stake
          </StakingInfoSubtitle>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <StakeValue variant="caption" fontWeight="bold" style={{ marginBottom: 0 }}>
              {formatNumberWithCommas(stake.principal.toString())}
            </StakeValue>
            <StakeToken fontWeight="medium">SUI</StakeToken>
          </div>
        </div>
        <div>
          {stake.status === 'Active' && stake.startedEarning && (
            <>
              <StakingInfoSubtitle variant="caption" fontWeight="bold">
                Earned
              </StakingInfoSubtitle>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <StakeValue
                  variant="caption"
                  fontWeight="bold"
                  style={{ marginBottom: 0 }}
                  earned={!!stake.estimatedReward?.int}
                >
                  {stake.estimatedReward && formatNumberWithCommas(stake.estimatedReward?.toString())}
                </StakeValue>
                <StakeToken fontWeight="medium" earned={!!stake.estimatedReward?.int}>
                  SUI
                </StakeToken>
              </div>
            </>
          )}
          {stake.rewardsStart !== undefined && (
            <>
              <StakingInfoSubtitle variant="caption" fontWeight="bold">
                Starts earning in
              </StakingInfoSubtitle>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <StakingInfoSubtitle variant="caption" fontWeight="medium">
                  {formatTimeDifference(new Date(), stake.rewardsStart)}
                </StakingInfoSubtitle>
              </div>
            </>
          )}
        </div>
      </StakingInfoContent>
      {stake.status !== 'Active' && (
        <UnstakeButton disabled variant="outlined">
          Stake pending activation
        </UnstakeButton>
      )}
      {stake.status === 'Active' && (
        <UnstakeButton variant="outlined" onClick={handleUnstakeClick}>
          Unstake {stake.startedEarning && 'and Collect Earned'}
        </UnstakeButton>
      )}
      <DetailsContainer>
        <DetailsLabel variant="caption" fontWeight="bold" style={{ marginRight: 16 }}>
          Details
        </DetailsLabel>
        <HrLine />
      </DetailsContainer>
      {<div style={{ height: 16 }} />}
      <DetailsInfoContainer>
        <DetailsInfoLabel fontWeight="medium" variant="description">
          APY
        </DetailsInfoLabel>
        <DetailsInfoValue fontWeight="medium" variant="description">
          {stake.validator?.apy && formatNumberToPct(stake.validator.apy, 2, true)}
        </DetailsInfoValue>
      </DetailsInfoContainer>
      <DetailsInfoContainer>
        <DetailsInfoLabel fontWeight="medium" variant="description">
          Commission
        </DetailsInfoLabel>
        <DetailsInfoValue fontWeight="medium" variant="description">
          {stake.validator?.commission && formatNumberToPct(stake.validator.commission, 2, false)}
        </DetailsInfoValue>
      </DetailsInfoContainer>
    </Container>
  )
}
