import Button from 'components/Button/Button'
import styled from 'styled-components'

export const Wrapper = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
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
