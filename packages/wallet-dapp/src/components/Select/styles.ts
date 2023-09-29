import styled from 'styled-components'

export const OptionWithImage = styled.div`
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 8px 12px;
  align-items: center;
  font-size: 12px;
  &:hover {
    background-color: ${p => p.theme.colors.background.hover};
  }
`
