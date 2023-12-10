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

export const CustomPlaceholder = styled.div`
  width: 27px;
  height: 27px;
  background-color: ${p => p.theme.colors.button.primary};
  border-radius: 4px;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  text-transform: uppercase;
`
