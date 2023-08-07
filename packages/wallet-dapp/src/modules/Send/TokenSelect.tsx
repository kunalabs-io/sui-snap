import styled from 'styled-components'

import Typography from 'components/Typography/Typography'
import { Coin } from 'modules/Info/CoinItem'
import Select from 'components/Select/Select'

interface Props {
  label: string
  coin: Coin
  handleCoinChange: (coin: Coin) => void
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

const TokenSelect = ({ label, coin }: Props) => {
  const handleOptionClick = () => {
    console.log('handleOptionClick')
  }
  return (
    <div>
      <Label variant="description">{label}</Label>
      <Container>
        <div style={{ marginRight: 10, display: 'flex' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="37" height="37" viewBox="0 0 37 37" fill="none">
            <circle cx="18.5" cy="18.5" r="18.5" fill="#22A2ED" />
          </svg>
        </div>
        <div>{coin.symbol}</div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
          <BalanceLabel variant="body">Balance:</BalanceLabel>
          <BalanceValue variant="body">{coin.amount}</BalanceValue>
          <Select
            options={[
              { name: 'SUI', value: 'sui' },
              { name: 'USDT', value: 'usdt' },
            ]}
            style={{ padding: '0 8px', border: 'none', backgroundColor: 'inherit', width: 80 }}
            onOptionClick={handleOptionClick}
          />
        </div>
      </Container>
    </div>
  )
}

export default TokenSelect
