import { Children, Stylable } from 'utils/types'
import { StyledIconButton } from './styles'

interface IconButtonProps extends Stylable, Children {
  onClick?: () => void
  disabled?: boolean
}

const IconButton = ({ onClick, disabled, children }: IconButtonProps) => {
  return (
    <StyledIconButton onClick={onClick} disabled={disabled}>
      {children}
    </StyledIconButton>
  )
}

export default IconButton
