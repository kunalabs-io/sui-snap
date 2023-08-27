import styled from 'styled-components'

import Typography from 'components/Typography/Typography'

export const InputContainer = styled.div`
  display: flex;
  flex-direction: column;
`

export const InputLabel = styled(Typography)`
  margin-bottom: 7px;
  color: ${p => p.theme.colors.text.alternative};
`

export const StyledInput = styled.input<{ error: boolean }>`
  font-family: ${({ theme }) => theme.typography.family.Roboto} !important;
  width: 100%;
  border-radius: 6px;
  border: 1px solid ${p => (p.error ? p.theme.colors.text.danger : p.theme.colors.divider)};
  font-size: 14px;
  padding: 13px 10px;
  &::placeholder {
    color: ${p => p.theme.colors.text.secondary};
    font-size: 14px;
  }
  &:disabled {
    background-color: #f2f2f2;
  }
`

export const MaxLabelContainer = styled.div<{ disabled?: boolean }>`
  cursor: ${p => (p.disabled ? 'not-allowed' : 'pointer')};
  opacity: ${p => (p.disabled ? 0.5 : 1)};
`

export const MaxLabel = styled(Typography)`
  position: absolute;
  right: 13px;
  top: 11px;
  color: ${p => p.theme.colors.text.alternative};
  padding: 3px 13px;
  border-radius: 46px;
  border: 1px solid ${p => p.theme.colors.divider};
`

export const ErrorMessage = styled(Typography)`
  color: ${p => p.theme.colors.text.danger};
  position: absolute;
  font-size: 10px;
  bottom: -15px;
`
