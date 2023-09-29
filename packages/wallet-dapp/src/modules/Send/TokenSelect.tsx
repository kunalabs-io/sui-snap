import { useState } from 'react'
import styled from 'styled-components'

import Typography from 'components/Typography/Typography'
import { CoinInfo } from 'utils/useWalletBalances'
import { suiTypeArg } from 'utils/const'
import { IconSuiSmall } from 'components/Icons/IconSui'
import { formatNumberWithCommas } from 'utils/formatting'
import { FilterOption, SelectAsset, Option } from 'components/Select/Select'
import { IconMissingImgSmall } from 'components/Icons/IconMissingImg'
import ImageWithFallback from 'components/ImageWithFallback'

interface Props {
  label: string
  coin?: CoinInfo
  options: CoinInfo[]
  handleCoinChange: (coin: CoinInfo) => void
  disabled: boolean
}

const Label = styled(Typography)`
  margin-bottom: 7px;
  color: ${p => p.theme.colors.text.alternative};
`

const TokenSelect = ({ label, coin, options, handleCoinChange, disabled }: Props) => {
  const [showAssetImage, setShowAssetImage] = useState(true)

  const handleOptionClick = (option: Option | null) => {
    if (!option) {
      return
    }
    const newCoinInfo = options.find(o => o.meta.typeArg === option.value)
    if (newCoinInfo) {
      handleCoinChange(newCoinInfo)
    }
  }

  const handleMenuOpen = () => {
    setShowAssetImage(false)
  }

  const handleMenuClose = () => {
    setShowAssetImage(true)
  }

  const customFilterOption = (option: FilterOption, inputValue: string) => {
    const inputValueLower = inputValue.toLowerCase()
    const optionLabelLower = option.label.toLowerCase()
    const optionNameLower = option.data.name?.toLowerCase() || ''
    return optionLabelLower.includes(inputValueLower) || optionNameLower.includes(inputValueLower)
  }

  return (
    <div style={{ padding: '0 14px', marginBottom: 20 }}>
      <Label variant="description" fontWeight="medium">
        {label}
      </Label>
      <div style={{ position: 'relative' }}>
        {showAssetImage ? (
          <div style={{ position: 'absolute', zIndex: 12, top: 9, left: 12 }}>
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
        ) : null}
        <SelectAsset
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
            label: coin?.meta.name || '',
            value: coin?.meta.typeArg || '',
            image: coin?.meta.iconUrl || '',
            balance: formatNumberWithCommas(coin?.amount.toString() || ''),
            name: coin?.meta.name || '',
          }}
          disabled={disabled}
          handleMenuOpen={handleMenuOpen}
          handleMenuClose={handleMenuClose}
        />
      </div>
    </div>
  )
}

export default TokenSelect
