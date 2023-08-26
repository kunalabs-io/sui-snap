import { useWalletKit } from '@mysten/wallet-kit'

import Typography from 'components/Typography/Typography'
import { IconFlask } from 'components/Icons/IconFlask'
import { ButtonWrapper, Wrapper } from './styles'
import { FlaskStatus } from '@kunalabs-io/sui-snap-wallet'

interface Props {
  flaskStatus?: FlaskStatus
  connectedToSnap: boolean
}

const Welcome = ({ flaskStatus, connectedToSnap }: Props) => {
  const kit = useWalletKit()

  const statusLoading = flaskStatus === undefined
  const flaskInstalled = !!flaskStatus?.flaskAvailable
  const overriden = !!flaskStatus?.overriden

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
      {!statusLoading && (
        <Typography variant="title" fontWeight="medium" style={{ marginBottom: 20 }}>
          Welcome!
        </Typography>
      )}

      {!statusLoading && !flaskInstalled && (
        <>
          <Typography variant="body" color="secondary" style={{ marginBottom: overriden ? 10 : 50 }}>
            Get started by installing MetaMask Flask.{' '}
          </Typography>
          {overriden && (
            <Typography variant="body" color="secondary" style={{ marginBottom: 20 }}>
              If you have it installed already, please disable any other wallets that might be interfering with MetaMask
              Flask.
            </Typography>
          )}
          <a href="https://metamask.io/flask/" target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
            <ButtonWrapper variant="outlined">
              <IconFlask />
              Install Flask
            </ButtonWrapper>
          </a>
        </>
      )}
      {!statusLoading && flaskInstalled && (
        <>
          <Typography variant="body" color="secondary" style={{ marginBottom: overriden ? 10 : 50 }}>
            Get started by connecting to Flask.
          </Typography>
          <ButtonWrapper variant="outlined" onClick={handleConnectClick}>
            <IconFlask />
            Connect
          </ButtonWrapper>
        </>
      )}
    </Wrapper>
  )
}

export default Welcome
