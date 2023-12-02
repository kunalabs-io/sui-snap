import { IconBack } from 'components/Icons/IconBack'
import styled from 'styled-components'

const Container = styled.div`
  padding-top: 16px;
  padding-left: 24px;
  padding-right: 24px;
`

const IconContainer = styled.div`
  cursor: pointer;
  display: flex;
`

export const NewStake = () => {
  return (
    <Container>
      <IconContainer style={{ marginBottom: 24 }}>
        <IconBack />
      </IconContainer>
    </Container>
  )
}
