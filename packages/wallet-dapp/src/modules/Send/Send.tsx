import { useCallback, useState } from 'react'

import Input from 'components/Input/Input'
import { EstimatedLabel, EstimatedUsd, EstimatedValue, GasLabel, SendLabel } from './styles'
import Button from 'components/Button/Button'
import TokenSelect from './TokenSelect'
import { Coin } from 'modules/Info/CoinItem'

interface Props {
  onRejectClick: () => void
}

const mockedCoins = [
  {
    name: 'Sui',
    symbol: 'SUI',
    amount: '1,443.96',
  },

  {
    name: 'Tether',
    symbol: 'USDT',
    amount: '250.00',
  },
]

const Send = ({ onRejectClick }: Props) => {
  const [address, setAddress] = useState('')
  const [amount, setAmount] = useState('')
  const [selectedCoin, setSelectedCoin] = useState<Coin>(mockedCoins[0])

  const handleAddressChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setAddress(e.target.value)
  }, [])

  const handleAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value)
  }, [])

  const handleCoinChange = useCallback((coin: Coin) => {
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
      <TokenSelect label="Asset" coin={selectedCoin} handleCoinChange={handleCoinChange} />
      <Input
        inputText={amount}
        onChange={handleAmountChange}
        placeholder="0.00"
        label="Amount"
        style={{ marginBottom: 38 }}
        showMax
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
        <Button onClick={onRejectClick}>Send</Button>
      </div>
    </div>
  )
}

export default Send
