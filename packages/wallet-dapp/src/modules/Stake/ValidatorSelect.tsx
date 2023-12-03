import { useState } from 'react'
import styled from 'styled-components'

import Typography from 'components/Typography/Typography'
import { FilterOption, Option, SelectValidator } from 'components/Select/Select'
import { IconMissingImgSmall } from 'components/Icons/IconMissingImg'
import ImageWithFallback from 'components/ImageWithFallback'
import { ValidatorInfo } from './Stake'

interface Props {
  label: string
  validator?: ValidatorInfo
  options: ValidatorInfo[]
  handleValidatorChange: (validator: ValidatorInfo) => void
  disabled?: boolean
}

const Label = styled(Typography)`
  margin-bottom: 7px;
  color: ${p => p.theme.colors.text.alternative};
`

export const ValidatorSelect = ({ label, validator, options, handleValidatorChange, disabled }: Props) => {
  const [showAssetImage, setShowAssetImage] = useState(true)

  const handleOptionClick = (option: Option | null) => {
    if (!option) {
      return
    }
    const newValidatorInfo = options.find(o => o.id === option.value)
    if (newValidatorInfo) {
      handleValidatorChange(newValidatorInfo)
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
    return optionLabelLower.includes(inputValueLower)
  }

  return (
    <div style={{ marginBottom: 24 }}>
      <Label variant="description" fontWeight="medium">
        {label}
      </Label>
      <div style={{ position: 'relative' }}>
        {showAssetImage ? (
          <div style={{ position: 'absolute', zIndex: 12, top: 9, left: 12 }}>
            {validator?.iconUrl ? (
              <ImageWithFallback
                src={validator.iconUrl}
                style={{ width: 27, height: 27 }}
                alt={validator?.name || ''}
                isSmallPlaceholder
              />
            ) : typeof validator !== 'undefined' ? (
              <IconMissingImgSmall />
            ) : null}
          </div>
        ) : null}
        <SelectValidator
          options={options.map(o => ({
            label: o.name,
            value: o.id,
            image: o.iconUrl,
            apy: o.apy,
          }))}
          handleChange={handleOptionClick}
          customFilterOption={customFilterOption}
          selectedOption={{
            label: validator?.name || '',
            value: validator?.id || '',
            image: validator?.iconUrl || '',
            apy: validator?.apy,
          }}
          disabled={disabled}
          handleMenuOpen={handleMenuOpen}
          handleMenuClose={handleMenuClose}
        />
      </div>
    </div>
  )
}

export default ValidatorSelect
