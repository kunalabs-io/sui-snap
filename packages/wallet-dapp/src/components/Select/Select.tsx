import { Stylable } from 'utils/types'
import { StyledSelect } from './styles'

export interface Option {
  value: string
  name: string
}

interface Props extends Stylable {
  options: Option[]
  onOptionClick: (option: Option) => void
}

const Select = ({ options, onOptionClick, style }: Props) => {
  return (
    <StyledSelect style={style}>
      {options.map(o => (
        <option key={o.value} value={o.value} onClick={() => onOptionClick(o)}>
          {o.name}
        </option>
      ))}
    </StyledSelect>
  )
}

export default Select
