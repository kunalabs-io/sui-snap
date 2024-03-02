import { useCallback, useState } from 'react'
import styled from 'styled-components'
import { toast } from 'react-toastify'

import { IconBack } from 'components/Icons/IconBack'
import ValidatorSelect from './ValidatorSelect'
import { ValidatorInfo } from './Stake'
import { useInputAmountValidate } from 'utils/input/useInputAmountValidate'
import Input from 'components/Input/Input'
import Typography from 'components/Typography'
import { useWalletBalances } from 'utils/useWalletBalances'
import { WALLET_BALANCES_REFETCH_INTERVAL, suiTypeArg } from 'utils/const'
import Button from 'components/Button'
import Spinner from 'components/Spinner'
import { ellipsizeTokenAddress, formatTimeDifference } from 'utils/helpers'
import useLatestSuiSystemState from 'utils/useLatestSuiSystemState'
import { Amount } from 'lib/amount'
import { SUI_DECIMALS, SUI_SYSTEM_STATE_OBJECT_ID } from '@mysten/sui.js/utils'
import { formatNumberToPct, formatNumberWithCommas } from 'utils/formatting'
import { TransactionBlock } from '@mysten/sui.js/transactions'
import { useNetwork } from 'utils/useNetworkProvider'
import { UserRejectionError } from '@kunalabs-io/sui-snap-wallet'
import { useSignAndExecuteTransactionBlock, useSuiClient } from '@mysten/dapp-kit'

const Container = styled.div`
  padding-top: 16px;
  padding-left: 24px;
  padding-right: 24px;
`

const IconContainer = styled.div`
  cursor: pointer;
  display: flex;
`

const DetailsContainer = styled.div`
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

const DetailsInfoValue = styled(Typography)<{ isAddress?: boolean }>`
  color: ${p => (p.isAddress ? p.theme.colors.button.primary : p.theme.colors.text.alternative)};
  ${p => p.isAddress && 'cursor: pointer;'}
`

interface Props {
  onBackClick: () => void
  openStakeScreen: () => void
}

export const NewStake = ({ onBackClick, openStakeScreen }: Props) => {
  const [selectedValidator, setSelectedValidator] = useState<ValidatorInfo>()
  const [rawInputStr, setRawInputStr] = useState('')
  const [isSending, setIsSending] = useState(false)

  const client = useSuiClient()
  const { network, chain } = useNetwork()
  const { mutate: signAndExecuteTransactionBlock } = useSignAndExecuteTransactionBlock()

  const systemStateRes = useLatestSuiSystemState()

  const validators: ValidatorInfo[] | undefined = systemStateRes.data?.systemState.activeValidators.map(v => {
    return {
      address: v.suiAddress,
      poolId: v.stakingPoolId,
      name: v.name,
      apy: systemStateRes.data?.apyMap.get(v.suiAddress),
      imageUrl: v.imageUrl,
      totalSuiStaked: Amount.fromInt(BigInt(v.stakingPoolSuiBalance), SUI_DECIMALS),
      votingPower: Number(v.votingPower) / 100_00,
      commission: Number(v.commissionRate) / 100_00,
    }
  })

  let rewardsStart = undefined
  if (systemStateRes.data?.systemState) {
    rewardsStart = new Date(
      Number(systemStateRes.data.systemState.epochStartTimestampMs) +
        Number(systemStateRes.data.systemState.epochDurationMs)
    )
  }

  let rewardsRedeemable = undefined
  if (systemStateRes.data?.systemState) {
    rewardsRedeemable = new Date(
      Number(systemStateRes.data.systemState.epochStartTimestampMs) +
        Number(systemStateRes.data.systemState.epochDurationMs) * 2
    )
  }

  const {
    infos,
    isLoading: isLoadingWalletBalances,
    triggerUpdate: triggerWalletBalancesUpdate,
  } = useWalletBalances({
    refetchInterval: WALLET_BALANCES_REFETCH_INTERVAL,
  })

  const suiCoin = infos?.get(suiTypeArg)

  const { sanitizedInputValue, amount } = useInputAmountValidate(rawInputStr, suiCoin?.meta.decimals || 9)

  const handleAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setRawInputStr(e.target.value)
  }, [])

  const handleValidatorChange = useCallback((validator: ValidatorInfo) => {
    setSelectedValidator(validator)
  }, [])

  const handleMaxClick = useCallback(() => {
    if (!suiCoin) {
      return
    }
    setRawInputStr(suiCoin.amount.toString())
  }, [suiCoin])

  let stakeEnabled = false
  if (
    amount &&
    suiCoin &&
    amount.int > 0n &&
    amount.int <= suiCoin.amount.int &&
    amount.decimals === (suiCoin.meta.decimals || 0)
  ) {
    stakeEnabled = true
  }

  let amountError = undefined
  if (amount && amount.int <= 0n) {
    amountError = 'Amount must be greater than 0'
  }
  if (suiCoin && amount && amount.int > suiCoin.amount.int) {
    amountError = 'Amount too large'
  }

  const handleStakeClick = useCallback(async () => {
    if (!selectedValidator || !amount || !client) {
      return
    }

    setIsSending(true)

    const txb = new TransactionBlock()
    const stakeCoin = txb.splitCoins(txb.gas, [txb.pure(amount.int)])
    txb.moveCall({
      target: '0x3::sui_system::request_add_stake',
      arguments: [
        txb.sharedObjectRef({
          objectId: SUI_SYSTEM_STATE_OBJECT_ID,
          initialSharedVersion: 1,
          mutable: true,
        }),
        stakeCoin,
        txb.pure(selectedValidator.address), // txb.pure.address(validator)
      ],
    })

    signAndExecuteTransactionBlock(
      {
        transactionBlock: txb,
        requestType: 'WaitForLocalExecution',
        chain,
      },
      {
        onSuccess: async res => {
          const url = `https://suiexplorer.com/txblock/${res.digest}?network=${network}`
          toast.success(
            <div>
              Transaction succeeded:{' '}
              <a href={url} target="_blank" rel="noreferrer">
                {res.digest}
              </a>
            </div>
          )

          triggerWalletBalancesUpdate()
          openStakeScreen()
        },
        onError: e => {
          if (e instanceof UserRejectionError) {
            toast.warn('Transaction rejected')
            return
          }

          toast.error('Transaction failed')
          console.error(e)
          return
        },
        onSettled: () => {
          setIsSending(false)
        },
      }
    )
  }, [
    client,
    selectedValidator,
    amount,
    signAndExecuteTransactionBlock,
    chain,
    network,
    triggerWalletBalancesUpdate,
    openStakeScreen,
  ])

  if (isLoadingWalletBalances || systemStateRes.isLoading) {
    return (
      <Container>
        <Spinner />
      </Container>
    )
  }

  return (
    <Container>
      <IconContainer style={{ marginBottom: 24 }} onClick={onBackClick}>
        <IconBack />
      </IconContainer>
      <ValidatorSelect
        label="Validator"
        selectedValidator={selectedValidator?.address}
        handleValidatorChange={handleValidatorChange}
        validators={validators || []}
        disabled={!infos || infos.size === 0 || isSending}
      />
      <Input
        inputText={sanitizedInputValue}
        onChange={handleAmountChange}
        placeholder="0.00"
        label={
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>Amount</div>
            <div onClick={handleMaxClick}>
              <Typography variant="body" color="secondary" style={{ cursor: 'pointer' }}>
                {`Balance: ${suiCoin?.amount
                  .toNumber()
                  .toLocaleString('en-US', { maximumFractionDigits: 20 })} ${suiCoin?.meta.symbol}`}
              </Typography>
            </div>
          </div>
        }
        style={{ marginBottom: 24 }}
        disabled={isSending}
        errorMessage={!stakeEnabled ? amountError : undefined}
      />

      {selectedValidator && (
        <>
          <DetailsContainer>
            <DetailsLabel variant="caption" fontWeight="bold" style={{ marginRight: 16 }}>
              Details
            </DetailsLabel>
            <HrLine />
          </DetailsContainer>
          {<div style={{ height: 16 }} />}
          <DetailsInfoContainer>
            <DetailsInfoLabel fontWeight="medium" variant="description">
              Validator
            </DetailsInfoLabel>
            <DetailsInfoValue fontWeight="medium" variant="description">
              {selectedValidator.name}
            </DetailsInfoValue>
          </DetailsInfoContainer>
          <DetailsInfoContainer>
            <DetailsInfoLabel fontWeight="medium" variant="description">
              Address
            </DetailsInfoLabel>
            <div>
              <a
                target="_blank"
                rel="noreferrer"
                href={`https://suiexplorer.com/validator/${selectedValidator.address}?network=${network}`}
                style={{ textDecoration: 'none' }}
              >
                <DetailsInfoValue fontWeight="medium" variant="description" isAddress>
                  {ellipsizeTokenAddress(selectedValidator.address)}
                </DetailsInfoValue>
              </a>
            </div>
          </DetailsInfoContainer>
          <DetailsInfoContainer>
            <DetailsInfoLabel fontWeight="medium" variant="description">
              Total SUI staked
            </DetailsInfoLabel>
            <DetailsInfoValue fontWeight="medium" variant="description">
              {formatNumberWithCommas(selectedValidator.totalSuiStaked.toString())} SUI
            </DetailsInfoValue>
          </DetailsInfoContainer>
          <DetailsInfoContainer>
            <DetailsInfoLabel fontWeight="medium" variant="description">
              Voting power
            </DetailsInfoLabel>
            <DetailsInfoValue fontWeight="medium" variant="description">
              {formatNumberToPct(selectedValidator.votingPower, 2, true)}
            </DetailsInfoValue>
          </DetailsInfoContainer>
          <DetailsInfoContainer>
            <DetailsInfoLabel fontWeight="medium" variant="description">
              Commission
            </DetailsInfoLabel>
            <DetailsInfoValue fontWeight="medium" variant="description">
              {formatNumberToPct(selectedValidator.commission, 2, false)}
            </DetailsInfoValue>
          </DetailsInfoContainer>
          <DetailsInfoContainer>
            <DetailsInfoLabel fontWeight="medium" variant="description">
              Staking APY
            </DetailsInfoLabel>
            <DetailsInfoValue fontWeight="medium" variant="description">
              {selectedValidator.apy !== undefined ? formatNumberToPct(selectedValidator.apy || 0, 2, true) : '--'}
            </DetailsInfoValue>
          </DetailsInfoContainer>
          <DetailsInfoContainer>
            <DetailsInfoLabel fontWeight="medium" variant="description">
              Rewards start in
            </DetailsInfoLabel>
            <DetailsInfoValue fontWeight="medium" variant="description">
              {rewardsStart ? formatTimeDifference(new Date(), rewardsStart) : '--'}
            </DetailsInfoValue>
          </DetailsInfoContainer>
          <DetailsInfoContainer>
            <DetailsInfoLabel fontWeight="medium" variant="description">
              Rewards redeemable in
            </DetailsInfoLabel>
            <DetailsInfoValue fontWeight="medium" variant="description">
              {rewardsRedeemable ? formatTimeDifference(new Date(), rewardsRedeemable) : '--'}
            </DetailsInfoValue>
          </DetailsInfoContainer>
          <Typography variant="body" color="secondary" style={{ margin: '22px 0' }}>
            Staked SUI starts counting as validator’s stake at the end of the Epoch in which it was staked. Rewards are
            earned separately for each Epoch and become available at the end of each Epoch.
          </Typography>
          <Button
            style={{ width: '100%', marginBottom: 20 }}
            disabled={!stakeEnabled || isSending}
            onClick={handleStakeClick}
          >
            {isSending ? (
              <Spinner
                style={{
                  marginTop: 0,
                  marginLeft: 0,
                  border: '5px solid #ffffff',
                  borderBottomColor: 'transparent',
                  width: 32,
                  height: 32,
                }}
              />
            ) : (
              <span>Stake Now</span>
            )}
          </Button>
        </>
      )}
    </Container>
  )
}
