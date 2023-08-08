import { useWalletKit } from '@mysten/wallet-kit'

import Typography from 'components/Typography/Typography'
import { IconFlask } from 'components/Icons/IconFlask'
import { ButtonWrapper, Wrapper } from './styles'

interface Props {
  flaskInstalled: boolean
  connectedToSnap: boolean
}

const Welcome = ({ flaskInstalled, connectedToSnap }: Props) => {
  const kit = useWalletKit()

  const handleConnectClick = async () => {
    if (connectedToSnap) {
      await kit.disconnect()
    }

    try {
      await kit.connect('Sui MetaMask Snap')
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <Wrapper>
      <Typography variant="title" fontWeight="medium" style={{ marginBottom: 20 }}>
        Welcome!
      </Typography>
      <Typography variant="body" color="secondary" style={{ marginBottom: 50 }}>
        Get started by connecting to and installing the Sui Snap.
      </Typography>
      {flaskInstalled ? (
        <ButtonWrapper variant="outlined" onClick={handleConnectClick}>
          <IconFlask />
          Connect
        </ButtonWrapper>
      ) : (
        <a href="https://metamask.io/flask/" target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
          <ButtonWrapper variant="outlined">
            <IconFlask />
            Install flask
          </ButtonWrapper>
        </a>
      )}
    </Wrapper>
  )
}

export default Welcome
