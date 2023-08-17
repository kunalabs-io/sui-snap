import styled, { useTheme } from 'styled-components'

import Typography from 'components/Typography/Typography'
import { CoinInfo } from 'utils/useWalletBalances'
import { IconSui } from 'components/Icons/IconSui'
import { suiTypeArg } from 'utils/const'

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

export interface Props {
  coinInfo: CoinInfo | undefined
  onCoinClick: (info: CoinInfo) => void
}

const CoinItem = ({ coinInfo, onCoinClick }: Props) => {
  const theme = useTheme()

  if (typeof coinInfo === 'undefined') {
    return null
  }

  return (
    <Container onClick={() => onCoinClick(coinInfo)}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ marginRight: 10 }}>
          {coinInfo.meta.typeArg === suiTypeArg ? (
            <IconSui />
          ) : coinInfo.meta.iconUrl ? (
            <img src={coinInfo.meta.iconUrl} style={{ width: 37, height: 37 }} />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="37" height="37" viewBox="0 0 37 37" fill="none">
              <circle cx="18.5" cy="18.5" r="18.5" fill="#22A2ED" />
            </svg>
          )}
        </div>
        <div>
          <Typography variant="body">{coinInfo.meta.name}</Typography>
          <Typography variant="caption" color="secondary">
            {coinInfo.meta.symbol}
          </Typography>
        </div>
      </div>
      <Typography variant="body" style={{ color: theme.colors.text.description }}>{`${coinInfo.amount.toString()} ${
        coinInfo.meta.symbol
      }`}</Typography>
    </Container>
  )
}

export default CoinItem
