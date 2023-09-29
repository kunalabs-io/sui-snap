import Select from 'react-select'
import { useTheme } from 'styled-components'

import { OptionWithImage } from './styles'
import { suiTypeArg } from 'utils/const'
import { IconSuiSmall } from 'components/Icons/IconSui'
import { IconMissingImgSmall } from 'components/Icons/IconMissingImg'
import ImageWithFallback from 'components/ImageWithFallback'
import Typography from 'components/Typography'

export interface Option {
  value: string
  label: string
  image?: string
  balance?: string
  name?: string
}

interface NetworkSelectProps {
  selectedOption: Option | null
  handleChange: (selectedOption: Option | null) => void
  options: Option[]
}

export interface FilterOption {
  readonly label: string
  readonly value: string
  readonly data: Option
}

interface SelectTokenProps extends NetworkSelectProps {
  customFilterOption: (option: FilterOption, inputValue: string) => boolean
  disabled?: boolean
}

export const NetworkSelect = ({ selectedOption, handleChange, options }: NetworkSelectProps) => {
  const theme = useTheme()
  return (
    <Select
      value={selectedOption}
      onChange={handleChange}
      options={options}
      isSearchable={false}
      styles={{
        control: provided => ({
          ...provided,
          borderColor: theme.colors.divider,
          minHeight: '28px',
          height: '28px',
          width: '105px',
          borderRadius: '22px',
          fontSize: '13px',
        }),
        singleValue: provided => ({
          ...provided,
          color: theme.colors.text.description,
          textTransform: 'capitalize',
        }),
        option: (provided, state) => ({
          ...provided,
          color: state.isSelected ? theme.colors.text.description : theme.colors.text.description,
          backgroundColor: state.isFocused
            ? theme.colors.background.hover
            : state.isSelected
            ? theme.colors.background.hover
            : 'transparent',
          fontSize: '12px',
          cursor: 'pointer',
          '&:active': {
            backgroundColor: theme.colors.background.hover,
          },
        }),

        valueContainer: provided => ({
          ...provided,
          height: '26px',
          padding: '0 6px',
        }),

        input: provided => ({
          ...provided,
          margin: '0px',
        }),
        indicatorSeparator: () => ({
          display: 'none',
        }),
        indicatorsContainer: provided => ({
          ...provided,
          height: '26px',
        }),
        dropdownIndicator: base => ({
          ...base,
          color: theme.colors.text.description,
          cursor: 'pointer',
          '&:hover': {
            color: theme.colors.text.description,
          },
          padding: '8px',
        }),
      }}
    />
  )
}

interface SelectAssetProps extends SelectTokenProps {
  handleMenuClose: () => void
}
export const SelectAsset = ({
  selectedOption,
  handleChange,
  options,
  disabled,
  customFilterOption,
  handleMenuClose,
}: SelectAssetProps) => {
  const theme = useTheme()

  return (
    <Select
      isDisabled={disabled}
      value={selectedOption}
      onChange={handleChange}
      options={options}
      menuPosition="fixed"
      styles={{
        control: provided => ({
          ...provided,
          height: '45px',
          fontWeight: 500,
          color: '#24272A',
        }),
        valueContainer: provided => ({
          ...provided,
          paddingLeft: 45,
        }),
        input: styles => ({ ...styles }),
      }}
      components={{
        Option: ({ innerProps, innerRef, data, isSelected, isFocused }) => (
          <div
            {...innerProps}
            ref={innerRef}
            style={{ backgroundColor: isSelected || isFocused ? theme.colors.background.hover : '' }}
          >
            <OptionWithImage>
              <div>
                {data.value === suiTypeArg ? (
                  <div style={{ marginRight: 8 }}>
                    <IconSuiSmall />
                  </div>
                ) : data.image ? (
                  <ImageWithFallback
                    src={data.image}
                    isSmallPlaceholder
                    style={{ width: 27, height: 27, marginRight: 8 }}
                    placeholderStyles={{ marginRight: 8 }}
                    alt={data.label}
                  />
                ) : (
                  <div style={{ marginRight: 8 }}>
                    <IconMissingImgSmall />
                  </div>
                )}
              </div>
              <Typography variant="body" fontWeight="medium" style={{ color: '#24272A' }}>
                {data.name}
              </Typography>
              <div style={{ color: theme.colors.text.secondary, fontSize: 13, fontWeight: 500, marginLeft: 4 }}>
                {data.label}
              </div>
              <Typography
                variant="body"
                fontWeight="medium"
                style={{ marginLeft: 'auto', color: theme.colors.text.description }}
              >
                {data.balance}
                <span style={{ marginLeft: 8 }}>{data.label}</span>
              </Typography>
            </OptionWithImage>
          </div>
        ),
      }}
      filterOption={customFilterOption}
      onMenuClose={handleMenuClose}
    />
  )
}
