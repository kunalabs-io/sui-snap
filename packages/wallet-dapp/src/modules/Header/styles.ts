import Typography from 'components/Typography/Typography'
import styled from 'styled-components'

export const Wrapper = styled.div`
  padding: 13px 16px;
  border-bottom: 1px solid #d6d9dc;
  background-color: ${p => p.theme.colors.background.primary};
  z-index: 100;
  box-shadow: 0px 1px 13px 1px rgba(0, 0, 0, 0.25);
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: fixed;
  top: 101px;
  width: 328px;
  border-radius: 7px;
`

export const Info = styled(Typography)`
  font-size: 14px;
  color: ${p => p.theme.colors.text.description};
`
