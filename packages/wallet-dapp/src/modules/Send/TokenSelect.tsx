import styled from 'styled-components'

import Typography from 'components/Typography/Typography'
import { CoinInfo } from 'utils/useWalletBalances'
import { suiTypeArg } from 'utils/const'
import { IconSuiSmall } from 'components/Icons/IconSui'
import { formatNumberWithCommas } from 'utils/formatting'
import { FilterOption, Option, SelectToken } from 'components/Select/Select'
import { IconMissingImgSmall } from 'components/Icons/IconMissingImg'
import ImageWithFallback from 'components/ImageWithFallback'

interface Props {
  label: string
  coin?: CoinInfo
  options: CoinInfo[]
  handleCoinChange: (coin: CoinInfo) => void
  disabled: boolean
}

const Container = styled.div<{ disabled: boolean }>`
  border-radius: 6px;
  border: 1px solid ${p => p.theme.colors.divider};
  height: 44px;
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  padding: 0 10px;
  ${p => p.disabled && `background-color: #f2f2f2;`}
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
  color: ${p => p.theme.colors.text.alternative};
`

const TokenSelect = ({ label, coin, options, handleCoinChange, disabled }: Props) => {
  const handleOptionClick = (option: Option | null) => {
    if (!option) {
      return
    }
    const newCoinInfo = options.find(o => o.meta.typeArg === option.value)
    if (newCoinInfo) {
      handleCoinChange(newCoinInfo)
    }
  }

  const customFilterOption = (option: FilterOption, inputValue: string) => {
    const inputValueLower = inputValue.toLowerCase()
    const optionLabelLower = option.label.toLowerCase()
    const optionNameLower = option.data.name?.toLowerCase() || ''

    return optionLabelLower.includes(inputValueLower) || optionNameLower.includes(inputValueLower)
  }

  return (
    <div style={{ padding: '0 14px' }}>
      <Label variant="description" fontWeight="medium">
        {label}
      </Label>
      <Container disabled={disabled}>
        <div style={{ marginRight: 10, display: 'flex' }}>
          {coin?.meta.typeArg === suiTypeArg ? (
            <IconSuiSmall />
          ) : coin?.meta.iconUrl ? (
            <ImageWithFallback
              src={coin.meta.iconUrl}
              style={{ width: 27, height: 27 }}
              alt={coin?.meta.name || ''}
              isSmallPlaceholder
            />
          ) : typeof coin !== 'undefined' ? (
            <IconMissingImgSmall />
          ) : null}
        </div>
        <Typography variant="description" fontWeight="medium" style={{ color: '#24272A' }}>
          {coin?.meta.symbol}
        </Typography>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
          {coin ? <BalanceLabel variant="body">Balance:</BalanceLabel> : null}
          <BalanceValue variant="body" fontWeight="medium">
            {formatNumberWithCommas(coin?.amount.toString() || '')}
          </BalanceValue>
          <SelectToken
            options={options.map(o => ({
              label: o.meta.symbol,
              value: o.meta.typeArg,
              image: o.meta.iconUrl,
              balance: formatNumberWithCommas(o.amount.toString()),
              name: o.meta.name,
            }))}
            handleChange={handleOptionClick}
            customFilterOption={customFilterOption}
            selectedOption={{
              label: coin?.meta.symbol || '',
              value: coin?.meta.typeArg || '',
              image: coin?.meta.iconUrl || '',
              balance: formatNumberWithCommas(coin?.amount.toString() || ''),
              name: coin?.meta.name || '',
            }}
            disabled={disabled}
          />
        </div>
      </Container>
    </div>
  )
}

export default TokenSelect
