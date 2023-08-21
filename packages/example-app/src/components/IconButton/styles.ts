import styled from 'styled-components'

export const StyledIconButton = styled.div<{ disabled?: boolean }>`
  border-radius: 50%;
  background-color: ${p => p.theme.colors.primary};
  width: 36px;
  height: 36px;
  opacity: ${p => (p.disabled ? '0.5' : 1)};
  cursor: ${p => (p.disabled ? 'not-allowed' : 'pointer')};
  display: flex;
  justify-content: center;
  align-items: center;
`
