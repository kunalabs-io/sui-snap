import styled from 'styled-components'

import Typography from 'components/Typography/Typography'

export const TextAreaLabel = styled(Typography)`
  margin-bottom: 7px;
  color: ${p => p.theme.colors.text.alternative};
`

export const Textarea = styled.textarea`
  background: #ffffff;
  border-radius: 0;
  border: none;
  border: 1px solid ${p => p.theme.colors.divider};
  font-size: 14px;
  line-height: 1.5;
  padding: 8px 0;
  resize: none;
  transition: border-color 150ms ease;
  width: 100%;
  box-sizing: border-box;
  padding: 12px 10px;
  border-radius: 6px;
  font-size: 14px;
  font-family: ${({ theme }) => theme.typography.family.Roboto} !important;
  &:hover {
    border-color: ${p => p.theme.colors.divider};
  }

  &:focus {
    outline: none;
    border-color: ${p => p.theme.colors.divider};
  }

  &::placeholder {
    color: ${p => p.theme.colors.text.secondary};
    font-size: 14px;
  }
`
