import { ReactNode } from 'react'

import { Stylable } from 'utils/types'
import { ErrorMessage, InputContainer, InputLabel, StyledInput } from './styles'

interface Props extends Stylable {
  inputText: string
  disabled?: boolean
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  label?: ReactNode
  placeholder?: string
  errorMessage?: string
}

const Input = ({ inputText, onChange, disabled, label, placeholder, style, errorMessage }: Props) => {
  const error = !!errorMessage

  return (
    <InputContainer style={style}>
      {label ? (
        <InputLabel variant="description" fontWeight="medium">
          {label}
        </InputLabel>
      ) : null}
      <div style={{ display: 'flex', position: 'relative' }}>
        <StyledInput
          value={inputText}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          error={error}
        />
        {error && <ErrorMessage>{errorMessage}</ErrorMessage>}
      </div>
    </InputContainer>
  )
}

export default Input
