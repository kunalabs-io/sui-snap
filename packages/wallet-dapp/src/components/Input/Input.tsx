import { Stylable } from 'utils/types'
import { ErrorMessage, InputContainer, InputLabel, MaxLabel, MaxLabelContainer, StyledInput } from './styles'

interface Props extends Stylable {
  inputText: string
  disabled?: boolean
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  label?: string
  placeholder?: string
  showMax?: boolean
  disableMax?: boolean
  onMaxClick?: () => void
  errorMessage?: string
}

const Input = ({
  inputText,
  onChange,
  disabled,
  label,
  placeholder,
  showMax,
  style,
  onMaxClick,
  disableMax,
  errorMessage,
}: Props) => {
  const error = !!errorMessage

  const handleMaxClick = () => {
    if (disableMax || disabled) {
      return
    }
    onMaxClick?.()
  }
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
        {showMax && (
          <MaxLabelContainer onClick={handleMaxClick} disabled={disableMax}>
            <MaxLabel variant="caption">Max</MaxLabel>
          </MaxLabelContainer>
        )}
        {error && <ErrorMessage>{errorMessage}</ErrorMessage>}
      </div>
    </InputContainer>
  )
}

export default Input
