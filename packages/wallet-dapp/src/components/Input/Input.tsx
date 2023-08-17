import { Stylable } from 'utils/types'
import { InputContainer, InputLabel, MaxLabel, StyledInput } from './styles'

interface Props extends Stylable {
  inputText: string
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  label?: string
  placeholder?: string
  showMax?: boolean
  onMaxClick?: () => void
}

const Input = ({ inputText, onChange, label, placeholder, showMax, style, onMaxClick }: Props) => {
  return (
    <InputContainer style={style}>
      {label ? <InputLabel variant="description">{label}</InputLabel> : null}
      <div style={{ display: 'flex', position: 'relative' }}>
        <StyledInput value={inputText} onChange={onChange} placeholder={placeholder} />
        {showMax && (
          <div onClick={onMaxClick}>
            <MaxLabel variant="caption">Max</MaxLabel>
          </div>
        )}
      </div>
    </InputContainer>
  )
}

export default Input
