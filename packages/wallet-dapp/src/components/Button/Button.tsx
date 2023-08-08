import { Children, Stylable } from 'utils/types'
import { StyledButton } from './styles'

interface ButtonProps extends Stylable, Children {
  onClick?: () => void
  variant?: 'contained' | 'outlined'
  disabled?: boolean
}

const Button = ({ children, variant = 'contained', disabled, onClick, style, className }: ButtonProps) => (
  <StyledButton variant={variant} disabled={disabled} style={style} className={className} onClick={onClick}>
    {children}
  </StyledButton>
)

export default Button
