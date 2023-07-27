import styled from 'styled-components'
import Welcome from '../Welcome/Welcome'

const Wrapper = styled.div`
  background-color: ${p => p.theme.colors.background.primary};
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 360px;
  height: 553px;
  border: 1px solid ${p => p.theme.colors.divider};
`

const Main = () => {
  return (
    <Wrapper>
      <Welcome />
    </Wrapper>
  )
}

export default Main
