import Typography from 'components/Typography/Typography'
import { ButtonWrapper, Wrapper } from './styles'
import { MetaMaskStatus } from '@kunalabs-io/sui-snap-wallet'
import { IconMetaMask } from 'components/Icons/IconMetaMask'
import { useConnectWallet, useDisconnectWallet, useWallets } from '@mysten/dapp-kit'

interface Props {
  mmStatus?: MetaMaskStatus
  connectedToSnap: boolean
}

const Welcome = ({ mmStatus, connectedToSnap }: Props) => {
  const { mutate: connect } = useConnectWallet()
  const { mutate: disconnect } = useDisconnectWallet()
  const wallets = useWallets()

  const statusLoading = mmStatus === undefined
  const mmAvailable = !!mmStatus?.available
  const supportsSnaps = !!mmStatus?.supportsSnaps

  const handleConnectClick = () => {
    if (connectedToSnap) {
      disconnect()
    }

    const wallet = wallets.find(wallet => wallet.name === 'Sui MetaMask Snap')
    if (!wallet) {
      return
    }

    try {
      connect({
        wallet,
      })
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
      {!statusLoading && mmAvailable && supportsSnaps && (
        <>
          <Typography variant="body" color="secondary" style={{ marginBottom: 50 }}>
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
