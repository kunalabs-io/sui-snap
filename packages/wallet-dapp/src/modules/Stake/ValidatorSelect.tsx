import { useState } from 'react'
import styled from 'styled-components'

import Typography from 'components/Typography/Typography'
import { FilterOption, Option, SelectValidator } from 'components/Select/Select'
import { IconMissingImgSmall } from 'components/Icons/IconMissingImg'
import ImageWithFallback from 'components/ImageWithFallback'
import { ValidatorInfo } from './Stake'
import { formatNumberToPct } from 'utils/formatting'

interface Props {
  label: string
  selectedValidator?: string
  validators: ValidatorInfo[]
  handleValidatorChange: (validator: ValidatorInfo) => void
  disabled?: boolean
}

interface ValidatorOption {
  name: string
  address: string
  imageUrl: string
  apy?: string
}

const Label = styled(Typography)`
  margin-bottom: 7px;
  color: ${p => p.theme.colors.text.alternative};
`

export const ValidatorSelect = ({ label, selectedValidator, validators, handleValidatorChange, disabled }: Props) => {
  const options: ValidatorOption[] = validators.map(v => ({
    name: v.name,
    address: v.address,
    imageUrl: v.imageUrl,
    apy: v.apy !== undefined ? formatNumberToPct(v.apy, 2, true) : undefined,
  }))
  const validator = options.find(v => v.address === selectedValidator)

  const [showAssetImage, setShowAssetImage] = useState(true)

  const handleOptionClick = (option: Option | null) => {
    if (!option) {
      return
    }
    const newValidatorInfo = validators.find(o => o.address === option.value)
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
            {validator?.imageUrl ? (
              <ImageWithFallback
                src={validator.imageUrl}
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
            value: o.address,
            image: o.imageUrl,
            apy: o.apy,
          }))}
          handleChange={handleOptionClick}
          customFilterOption={customFilterOption}
          selectedOption={{
            label: validator?.name || '',
            value: validator?.address || '',
            image: validator?.imageUrl || '',
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
