import Typography from 'components/Typography/Typography'
import { IconFlask } from 'components/Icons/IconFlask'
import { ButtonWrapper, Wrapper } from './styles'

const Welcome = () => {
  const handleOnClick = () => {
    console.log('handleOnClick')
  }

  return (
    <Wrapper>
      <Typography variant="title" fontWeight="medium" style={{ marginBottom: 20 }}>
        Welcome!
      </Typography>
      <Typography variant="body" color="secondary" style={{ marginBottom: 50 }}>
        Get started by connecting to and installing the Sui Snap.
      </Typography>
      <ButtonWrapper variant="outlined" onClick={handleOnClick}>
        <IconFlask />
        Install flask
      </ButtonWrapper>
      {/* <ButtonWrapper variant="outlined" onClick={handleOnClick}>
        <IconFlask />
        Connect
      </ButtonWrapper> */}
    </Wrapper>
  )
}

export default Welcome
