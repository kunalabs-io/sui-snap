import { Stylable } from 'utils/types'
import { TextAreaLabel, Textarea as StyledTextarea } from './styles'

interface Props extends Stylable {
  value: string
  disabled?: boolean
  textAreaRef: React.RefObject<HTMLTextAreaElement>
  onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void
  rows?: number
  label?: string
  placeholder?: string
}

const Textarea = ({ onChange, textAreaRef, disabled, rows, value, placeholder, label, style }: Props) => {
  return (
    <div style={style}>
      {label ? (
        <TextAreaLabel variant="description" fontWeight="medium">
          {label}
        </TextAreaLabel>
      ) : null}
      <StyledTextarea
        onChange={onChange}
        placeholder={placeholder}
        ref={textAreaRef}
        rows={rows || 1}
        value={value}
        disabled={disabled}
        style={disabled ? { backgroundColor: '#f2f2f2' } : {}}
      />
    </div>
  )
}

export default Textarea
