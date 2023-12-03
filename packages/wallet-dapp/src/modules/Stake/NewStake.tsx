import { useCallback, useState } from 'react'
import styled from 'styled-components'
import { useWalletKit } from '@mysten/wallet-kit'
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
import { ellipsizeTokenAddress } from 'utils/helpers'

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
}

const options: ValidatorInfo[] = [
  {
    id: 'id1',
    name: 'OKXEarn1',
    apy: '14.11%',
    iconUrl: 'https://raw.githubusercontent.com/okxEarnSuiValidator/OKX-SUI-Image/main/OKX-logo.png',
  },
  {
    id: 'id2',
    name: 'OKXEarn2',
    apy: '34.33%',
    iconUrl: 'https://raw.githubusercontent.com/okxEarnSuiValidator/OKX-SUI-Image/main/OKX-logo.png',
  },
  {
    id: 'id3',
    name: 'OKXEarn3',
    apy: '43.43%',
    iconUrl: 'https://raw.githubusercontent.com/okxEarnSuiValidator/OKX-SUI-Image/main/OKX-logo.png',
  },
]

export const NewStake = ({ onBackClick }: Props) => {
  const [selectedValidator, setSelectedValidator] = useState<ValidatorInfo>()
  const [rawInputStr, setRawInputStr] = useState('')
  const [isSending, setIsSending] = useState(false)

  const { currentAccount } = useWalletKit()

  const {
    infos,
    isLoading: isLoadingWalletBalances,
    // triggerUpdate: triggerWalletBalancesUpdate,
  } = useWalletBalances({
    refetchInterval: WALLET_BALANCES_REFETCH_INTERVAL,
  })

  const suiCoin = infos?.get(suiTypeArg)

  const { sanitizedInputValue, amount } = useInputAmountValidate(rawInputStr, suiCoin?.meta.decimals || 9)

  const handleAddressClick = useCallback(async () => {
    await navigator.clipboard.writeText(currentAccount?.address || '')
    toast.success('Address copied')
  }, [currentAccount?.address])

  const handleAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setRawInputStr(e.target.value)
  }, [])

  const handleValidatorChange = useCallback((coin: ValidatorInfo) => {
    setSelectedValidator(coin)
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

  if (isLoadingWalletBalances) {
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
        label="Asset"
        validator={selectedValidator}
        handleValidatorChange={handleValidatorChange}
        options={options}
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
          {selectedValidator?.name}
        </DetailsInfoValue>
      </DetailsInfoContainer>
      <DetailsInfoContainer>
        <DetailsInfoLabel fontWeight="medium" variant="description">
          Address
        </DetailsInfoLabel>
        <div onClick={handleAddressClick}>
          <DetailsInfoValue fontWeight="medium" variant="description" isAddress>
            {ellipsizeTokenAddress(currentAccount?.address || '')}
          </DetailsInfoValue>
        </div>
      </DetailsInfoContainer>
      <DetailsInfoContainer>
        <DetailsInfoLabel fontWeight="medium" variant="description">
          Total SUI staked
        </DetailsInfoLabel>
        <DetailsInfoValue fontWeight="medium" variant="description">
          39.92 M
        </DetailsInfoValue>
      </DetailsInfoContainer>
      <DetailsInfoContainer>
        <DetailsInfoLabel fontWeight="medium" variant="description">
          Voting power
        </DetailsInfoLabel>
        <DetailsInfoValue fontWeight="medium" variant="description">
          0.49%
        </DetailsInfoValue>
      </DetailsInfoContainer>
      <DetailsInfoContainer>
        <DetailsInfoLabel fontWeight="medium" variant="description">
          Commission
        </DetailsInfoLabel>
        <DetailsInfoValue fontWeight="medium" variant="description">
          9%
        </DetailsInfoValue>
      </DetailsInfoContainer>
      <DetailsInfoContainer>
        <DetailsInfoLabel fontWeight="medium" variant="description">
          Staking APY
        </DetailsInfoLabel>
        <DetailsInfoValue fontWeight="medium" variant="description">
          4.43%
        </DetailsInfoValue>
      </DetailsInfoContainer>
      <DetailsInfoContainer>
        <DetailsInfoLabel fontWeight="medium" variant="description">
          Rewards start in
        </DetailsInfoLabel>
        <DetailsInfoValue fontWeight="medium" variant="description">
          20 h 49 min
        </DetailsInfoValue>
      </DetailsInfoContainer>
      <DetailsInfoContainer>
        <DetailsInfoLabel fontWeight="medium" variant="description">
          Rewards redeemable in
        </DetailsInfoLabel>
        <DetailsInfoValue fontWeight="medium" variant="description">
          44 h 49 min
        </DetailsInfoValue>
      </DetailsInfoContainer>
      <Typography variant="body" color="secondary" style={{ margin: '22px 0' }}>
        Staked SUI starts counting as validator’s stake at the end of the Epoch in which it was staked. Rewards are
        earned separately for each Epoch and become available at the end of each Epoch.
      </Typography>
      <Button style={{ width: '100%', marginBottom: 20 }} disabled={!stakeEnabled || isSending}>
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
    </Container>
  )
}
