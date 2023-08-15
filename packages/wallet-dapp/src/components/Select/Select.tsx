import { ChangeEvent } from 'react'

import { Stylable } from 'utils/types'
import { StyledSelect } from './styles'

interface Option {
  value: string
  name: string
}

interface Props extends Stylable {
  options: Option[]
  onOptionClick: (option: string) => void
  selectedOption?: string
}

const Select = ({ options, onOptionClick, style, selectedOption }: Props) => {
  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onOptionClick(event.target.value)
  }

  return (
    <StyledSelect style={style} onChange={handleChange} value={selectedOption}>
      {options.map(o => (
        <option key={o.value} value={o.value}>
          {o.name}
        </option>
      ))}
    </StyledSelect>
  )
}

export default Select
