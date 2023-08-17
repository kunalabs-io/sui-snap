import { useCallback, useEffect, useMemo, useState } from 'react'

import Input from 'components/Input/Input'
import { EstimatedLabel, EstimatedUsd, EstimatedValue, GasLabel, SendLabel } from './styles'
import Button from 'components/Button/Button'
import TokenSelect from './TokenSelect'
import { CoinInfo } from 'utils/useWalletBalances'
import { useInputAmountValidate } from 'utils/input/useInputAmountValidate'
import { Amount } from 'lib/framework/amount'

interface Props {
  onRejectClick: () => void
  infos: Map<string, CoinInfo> | undefined
  initialCoinInfo?: CoinInfo
}

const isSubmitDisabled = (amount?: Amount, tokenBalance?: Amount) => {
  if (!amount || !tokenBalance) {
    return true
  }

  if (amount.int === 0n) {
    return true
  }

  if (amount.int > tokenBalance.int) {
    return true
  }

  return false
}

const Send = ({ onRejectClick, infos, initialCoinInfo }: Props) => {
  const [address, setAddress] = useState('')
  const [rawInputStr, setRawInputStr] = useState('')
  const [selectedCoin, setSelectedCoin] = useState<CoinInfo | undefined>(initialCoinInfo)

  const { sanitizedInputValue, amount } = useInputAmountValidate(rawInputStr, initialCoinInfo?.meta.decimals || 0)

  const handleAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setRawInputStr(e.target.value)
  }, [])

  const handleMaxClick = useCallback(() => {
    if (!selectedCoin) {
      return
    }
    setRawInputStr(selectedCoin.amount.toString())
  }, [selectedCoin])

  const options = useMemo(() => {
    if (!infos) {
      return []
    }
    return Array.from(infos.values())
  }, [infos])

  useEffect(() => {
    setSelectedCoin(initialCoinInfo)
  }, [initialCoinInfo])

  const handleAddressChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setAddress(e.target.value)
  }, [])

  const handleCoinChange = useCallback((coin: CoinInfo) => {
    setSelectedCoin(coin)
  }, [])

  return (
    <div>
      <SendLabel variant="subtitle2" color="primary">
        Send
      </SendLabel>
      <Input
        inputText={address}
        onChange={handleAddressChange}
        placeholder="Enter Address"
        label="Recipient"
        style={{ marginBottom: 20 }}
      />
      <TokenSelect label="Asset" coin={selectedCoin} handleCoinChange={handleCoinChange} options={options} />
      <Input
        inputText={sanitizedInputValue}
        onChange={handleAmountChange}
        placeholder="0.00"
        label="Amount"
        style={{ marginBottom: 38 }}
        showMax
        onMaxClick={handleMaxClick}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <GasLabel variant="body">Gas</GasLabel>
          <EstimatedLabel variant="caption">(estimated)</EstimatedLabel>
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <EstimatedUsd variant="body">$0.02</EstimatedUsd>
          <EstimatedValue variant="body">0.023330372 SUI</EstimatedValue>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 40 }}>
        <Button variant="outlined" onClick={onRejectClick}>
          Reject
        </Button>
        <Button onClick={onRejectClick} disabled={isSubmitDisabled(amount, selectedCoin?.amount)}>
          Send
        </Button>
      </div>
    </div>
  )
}

export default Send
