import Typography from 'components/Typography/Typography'
import { ButtonWrapper, Wrapper } from './styles'
import { MetaMaskProviderInfo } from '@kunalabs-io/sui-snap-wallet'
import { IconMetaMask } from 'components/Icons/IconMetaMask'
import { useDAppKit, useWallets } from '@mysten/dapp-kit-react'

interface Props {
  mmInfo?: MetaMaskProviderInfo
  connectedToSnap: boolean
}

const Welcome = ({ mmInfo, connectedToSnap }: Props) => {
  const dAppKit = useDAppKit()
  const wallets = useWallets()

  const statusLoading = mmInfo === undefined
  const mmAvailable = !!mmInfo?.available
  const supportsSnaps = !!mmInfo?.supportsSnaps

  const handleConnectClick = async () => {
    try {
      if (connectedToSnap) {
        await dAppKit.disconnectWallet()
      }

      const wallet = wallets.find(w => w.name === 'Sui MetaMask Snap')
      if (!wallet) {
        return
      }

      await dAppKit.connectWallet({ wallet })
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
