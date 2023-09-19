import Select from 'react-select'
import { useTheme } from 'styled-components'
import { OptionWithImage } from './styles'
import { suiTypeArg } from 'utils/const'
import { IconSuiSmall } from 'components/Icons/IconSui'
import { IconMissingImgSmall } from 'components/Icons/IconMissingImg'
import ImageWithFallback from 'components/ImageWithFallback'

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

export const SelectToken = ({
  selectedOption,
  handleChange,
  options,
  disabled,
  customFilterOption,
}: SelectTokenProps) => {
  const theme = useTheme()
  return (
    <Select
      autoFocus
      isDisabled={disabled}
      value={selectedOption}
      onChange={handleChange}
      options={options}
      menuPosition="fixed"
      styles={{
        menu: provided => ({
          ...provided,
          width: '200px',
          marginRight: 30,
          right: -40,
        }),
        menuList: provided => ({
          ...provided,
          width: '200px',
        }),
        control: provided => ({
          ...provided,
          borderColor: theme.colors.divider,
          minHeight: '28px',
          height: '28px',
          width: '70px',
          fontSize: '14px',
          border: 'none',
          boxShadow: 'none',
          marginLeft: '4px',
        }),
        singleValue: provided => ({
          ...provided,
          color: theme.colors.text.description,
          fontWeight: 500,
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
          fontSize: '14px',
          cursor: 'pointer',
          '&:active': {
            backgroundColor: theme.colors.background.hover,
          },
        }),

        valueContainer: provided => ({
          ...provided,
          height: '26px',
          padding: '0px',
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
          padding: '0px',
        }),
      }}
      components={{
        Option: ({ innerProps, innerRef, data, isSelected }) => (
          <div
            {...innerProps}
            ref={innerRef}
            style={{ backgroundColor: isSelected ? theme.colors.background.hover : '' }}
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
              <div>
                <div>{data.name}</div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ marginRight: 4, color: theme.colors.text.secondary, fontSize: 10 }}>{data.balance}</div>
                  <div style={{ color: theme.colors.text.secondary, fontSize: 10 }}>{data.label}</div>
                </div>
              </div>
            </OptionWithImage>
          </div>
        ),
      }}
      filterOption={customFilterOption}
    />
  )
}
