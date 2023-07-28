import styled, { useTheme } from 'styled-components'

import Typography from 'components/Typography/Typography'

const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  &:hover {
    background-color: ${p => p.theme.colors.background.hover};
  }
  cursor: pointer;
`
export interface Coin {
  name: string
  symbol: string
  amount: string
}

interface Props {
  coin: Coin
}

const CoinItem = ({ coin }: Props) => {
  const theme = useTheme()
  return (
    <Container key={coin.symbol}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ marginRight: 10 }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="37" height="37" viewBox="0 0 37 37" fill="none">
            <circle cx="18.5" cy="18.5" r="18.5" fill="#22A2ED" />
          </svg>
        </div>
        <div>
          <Typography variant="body">{coin.name}</Typography>
          <Typography variant="caption" color="secondary">
            {coin.symbol}
          </Typography>
        </div>
      </div>
      <Typography
        variant="body"
        style={{ color: theme.colors.text.description }}
      >{`${coin.amount} ${coin.symbol}`}</Typography>
    </Container>
  )
}

export default CoinItem
