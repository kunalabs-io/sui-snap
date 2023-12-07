import styled from 'styled-components'

export const StyledButton = styled.button<{
  variant: 'contained' | 'outlined'
  disabled?: boolean
}>`
  width: 157px;
  height: 45px;
  font-family: ${({ theme }) => theme.typography.family.Roboto};
  font-weight: ${p => p.theme.typography.weight.Bold};
  background-color: ${p =>
    p.variant === 'contained' ? p.theme.colors.button.primary : 'transparent'};
  cursor: ${p => (p.disabled ? 'not-allowed' : 'pointer')};
  color: ${p => (p.variant === 'contained' ? '#ffffff' : p.theme.colors.button.primary)};
  border: ${p =>
    p.variant === 'contained' ? 'none' : `1px solid ${p.theme.colors.button.primary}`};
  border-radius: 42px;
  font-size: 15px;
  opacity: ${p => (p.disabled ? '0.5' : 1)};
`
