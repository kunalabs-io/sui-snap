import { Stylable } from 'utils/types'
import { TextAreaLabel, Textarea as StyledTextarea } from './styles'

interface Props extends Stylable {
  value: string
  textAreaRef: React.RefObject<HTMLTextAreaElement>
  onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void
  rows?: number
  label?: string
  placeholder?: string
}

const Textarea = ({ onChange, textAreaRef, rows, value, placeholder, label, style }: Props) => {
  return (
    <div style={style}>
      {label ? (
        <TextAreaLabel variant="description" fontWeight="medium">
          {label}
        </TextAreaLabel>
      ) : null}
      <StyledTextarea onChange={onChange} placeholder={placeholder} ref={textAreaRef} rows={rows || 1} value={value} />
    </div>
  )
}

export default Textarea
