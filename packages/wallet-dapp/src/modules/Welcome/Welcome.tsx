import { useWalletKit } from '@mysten/wallet-kit'

import Typography from 'components/Typography/Typography'
import { ButtonWrapper, Wrapper } from './styles'
import { MetaMaskStatus } from '@kunalabs-io/sui-snap-wallet'
import { IconMetaMask } from 'components/Icons/IconMetaMask'

interface Props {
  mmStatus?: MetaMaskStatus
  connectedToSnap: boolean
}

const Welcome = ({ mmStatus, connectedToSnap }: Props) => {
  const kit = useWalletKit()

  const statusLoading = mmStatus === undefined
  const mmAvailable = !!mmStatus?.available
  const supportsSnaps = !!mmStatus?.supportsSnaps

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

      {!statusLoading && (!mmAvailable || !supportsSnaps) && (
        <>
          <Typography variant="body" color="secondary" style={{ marginBottom: supportsSnaps ? 50 : 10 }}>
            Get started by installing MetaMask.{' '}
          </Typography>
          {!supportsSnaps && (
            <Typography variant="body" color="secondary" style={{ marginBottom: 20 }}>
              If you have it installed already, update it to the newest version and disable any other wallets that might
              be interfering with MetaMask.
            </Typography>
          )}
          <a href="https://metamask.io/download" target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
            <ButtonWrapper variant="outlined">
              <IconMetaMask />
              Install MetaMask
            </ButtonWrapper>
          </a>
        </>
      )}
      {!statusLoading && mmAvailable && (
        <>
          <Typography variant="body" color="secondary" style={{ marginBottom: supportsSnaps ? 50 : 10 }}>
            Get started by connecting to MetaMask.
          </Typography>
          <ButtonWrapper variant="outlined" onClick={handleConnectClick}>
            <IconMetaMask />
            Connect
          </ButtonWrapper>
        </>
      )}
    </Wrapper>
  )
}

export default Welcome
