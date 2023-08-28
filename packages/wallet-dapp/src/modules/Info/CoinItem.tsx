import styled, { useTheme } from 'styled-components'

import Typography from 'components/Typography/Typography'
import { CoinInfo } from 'utils/useWalletBalances'
import { IconSui } from 'components/Icons/IconSui'
import { suiTypeArg } from 'utils/const'
import { formatNumberWithCommas } from 'utils/formatting'
import { IconMissingImg } from 'components/Icons/IconMissingImg'

const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
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
            <IconMissingImg />
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: 37 }}>
          <Typography variant="body" fontWeight="medium">
            {coinInfo.meta.name}
          </Typography>
          <Typography variant="caption" color="secondary" fontWeight="medium">
            {coinInfo.meta.symbol}
          </Typography>
        </div>
      </div>
      <Typography
        variant="body"
        fontWeight="medium"
        style={{ color: theme.colors.text.description }}
      >{`${formatNumberWithCommas(coinInfo.amount.toString())} ${coinInfo.meta.symbol}`}</Typography>
    </Container>
  )
}

export default CoinItem
