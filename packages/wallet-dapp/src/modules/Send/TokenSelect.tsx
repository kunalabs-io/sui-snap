import styled from 'styled-components'

import Typography from 'components/Typography/Typography'
import Select from 'components/Select/Select'
import { CoinInfo } from 'utils/useWalletBalances'
import { suiTypeArg } from 'utils/const'
import { IconSuiSmall } from 'components/Icons/IconSui'

interface Props {
  label: string
  coin?: CoinInfo
  options: CoinInfo[]
  handleCoinChange: (coin: CoinInfo) => void
  disabled: boolean
}

const Container = styled.div`
  border-radius: 6px;
  border: 1px solid ${p => p.theme.colors.divider};
  height: 44px;
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  padding: 0 10px;
`

const BalanceLabel = styled(Typography)`
  color: ${p => p.theme.colors.text.secondary};
  margin-right: 5px;
`
const BalanceValue = styled(Typography)`
  color: ${p => p.theme.colors.text.description};
`

const Label = styled(Typography)`
  margin-bottom: 7px;
  color: ${p => p.theme.colors.text.description};
`

const TokenSelect = ({ label, coin, options, handleCoinChange, disabled }: Props) => {
  const handleOptionClick = (option: string) => {
    const newCoinInfo = options.find(o => o.meta.typeArg === option)
    if (newCoinInfo) {
      handleCoinChange(newCoinInfo)
    }
  }

  return (
    <div>
      <Label variant="description">{label}</Label>
      <Container>
        <div style={{ marginRight: 10, display: 'flex' }}>
          {coin?.meta.typeArg === suiTypeArg ? (
            <IconSuiSmall />
          ) : coin?.meta.iconUrl ? (
            <img src={coin.meta.iconUrl} style={{ width: 27, height: 27 }} />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="27" height="27" viewBox="0 0 27 27" fill="none">
              <circle cx="13.5" cy="13.5" r="13.5" fill="#22A2ED" />
            </svg>
          )}
        </div>
        <div>{coin?.meta.symbol}</div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
          {coin ? <BalanceLabel variant="body">Balance:</BalanceLabel> : null}
          <BalanceValue variant="body">{coin?.amount.toString()}</BalanceValue>
          <Select
            options={options.map(o => ({ name: o.meta.symbol, value: o.meta.typeArg }))}
            style={{ padding: '0 8px', border: 'none', width: 80 }}
            onOptionClick={handleOptionClick}
            selectedOption={coin?.meta.typeArg || ''}
            disabled={disabled}
          />
        </div>
      </Container>
    </div>
  )
}

export default TokenSelect
