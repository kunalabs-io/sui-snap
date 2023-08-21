import Select from 'react-select'
import { useTheme } from 'styled-components'

export interface Option {
  value: string
  label: string
}

interface Props {
  selectedOption: Option | null
  handleChange: (selectedOption: Option | null) => void
  options: Option[]
  disabled?: boolean
  hideBorder?: boolean
  width?: string
  fontSize?: string
  padding?: string
  indicatorPadding?: string
  controlMarginLeft?: string
}

const CustomSelect = ({
  selectedOption,
  handleChange,
  options,
  disabled,
  hideBorder,
  width,
  fontSize,
  padding,
  indicatorPadding,
  controlMarginLeft,
}: Props) => {
  const theme = useTheme()
  return (
    <Select
      isDisabled={disabled}
      value={selectedOption}
      onChange={handleChange}
      options={options}
      styles={{
        control: provided => ({
          ...provided,
          borderColor: theme.colors.divider,
          minHeight: '28px',
          height: '28px',
          width: width || '100px',
          borderRadius: '22px',
          fontSize: fontSize || '12px',
          border: hideBorder ? 'none' : '',
          boxShadow: hideBorder ? 'none' : '',
          marginLeft: controlMarginLeft || '',
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
          fontSize: fontSize || '12px',
          cursor: 'pointer',
          '&:active': {
            backgroundColor: theme.colors.background.hover,
          },
        }),

        valueContainer: provided => ({
          ...provided,
          height: '26px',
          padding: padding || '0 6px',
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
          padding: indicatorPadding || '8px',
        }),
      }}
    />
  )
}

export default CustomSelect
