import { Stylable } from 'utils/types'
import { StyledSelect } from './styles'

export interface Option {
  value: string
  name: string
}

interface Props extends Stylable {
  options: Option[]
  onOptionClick: (option: Option) => void
  selectedOption?: string
}

const Select = ({ options, onOptionClick, style, selectedOption }: Props) => {
  return (
    <StyledSelect style={style}>
      {options.map(o => (
        <option key={o.value} value={o.value} onClick={() => onOptionClick(o)} selected={selectedOption === o.value}>
          {o.name}
        </option>
      ))}
    </StyledSelect>
  )
}

export default Select
