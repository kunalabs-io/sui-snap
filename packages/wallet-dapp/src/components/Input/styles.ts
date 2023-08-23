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

export const StyledInput = styled.input`
  font-family: ${({ theme }) => theme.typography.family.Roboto} !important;
  width: 100%;
  border-radius: 6px;
  border: 1px solid ${p => p.theme.colors.divider};
  padding: 13px 10px;
  &::placeholder {
    color: ${p => p.theme.colors.text.secondary};
    font-size: 14px;
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
