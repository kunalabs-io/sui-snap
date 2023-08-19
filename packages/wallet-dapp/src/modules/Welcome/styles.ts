import Button from 'components/Button/Button'
import styled from 'styled-components'

export const Wrapper = styled.div`
  max-width: 250px;
  text-align: center;
  margin: auto;
  margin-top: 111px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`

export const ButtonWrapper = styled(Button)`
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  font-weight: ${p => p.theme.typography.weight.Medium};
  height: 30px;
  font-size: ${p => p.theme.typography.size.Body}px;
  & > svg {
    margin-right: 9px;
  }
`
