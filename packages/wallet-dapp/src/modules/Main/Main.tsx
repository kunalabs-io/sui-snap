import styled from 'styled-components'

import Dashboard from 'modules/Dashboard/Dashboard'

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
      <Dashboard />
    </Wrapper>
  )
}

export default Main
