import { useEffect, useState } from 'react'
import { ConnectButton, InstallFlaskButton, ReconnectButton, Card, Button } from '../../components'
import { CardContainer, Container, ErrorMessage, Heading, Notice, Span, Subtitle } from './styles'
import { SuiSnapWalletAdapter } from '@kunalabs-io/sui-snap-wallet-adapter'
import { TransactionBlock } from '@mysten/sui.js'
import { useWalletKit } from '@mysten/wallet-kit'

const Main = () => {
  const [error, setError] = useState<string | undefined>(undefined)

  const kit = useWalletKit()

  const [flaskInstalled, setFlaskInstalled] = useState<boolean>(false)
  useEffect(() => {
    SuiSnapWalletAdapter.flaskAvailable()
      .then(setFlaskInstalled)
      .catch(e => {
        setFlaskInstalled(false)
        console.error(e)
      })
  }, [])

  const connectedToSnap = kit.isConnected && kit.currentWallet?.name === 'Sui MetaMask Snap'

  const handleConnectClick = async () => {
    if (connectedToSnap) {
      await kit.disconnect()
    }

    try {
      await kit.connect('Sui MetaMask Snap')
    } catch (e) {
      if (typeof e === 'string') {
        setError(e)
      } else {
        setError((e as Error).message)
      }
    }
  }

  const signMessage = async () => {
    if (!connectedToSnap || !kit.currentAccount) {
      return
    }

    try {
      const adapter = new SuiSnapWalletAdapter()

      const signed = await adapter.signMessage({
        message: new Uint8Array([1, 2, 3]),
        account: kit.currentAccount,
      })

      console.log(signed)
    } catch (e) {
      if (typeof e === 'string') {
        setError(e)
      } else {
        setError((e as Error).message)
      }
    }
  }

  const signTransactionBlock = async () => {
    if (!connectedToSnap || !kit.currentAccount) {
      return
    }

    try {
      const adapter = new SuiSnapWalletAdapter()

      const txb = new TransactionBlock()
      const [coin] = txb.splitCoins(txb.gas, [txb.pure(100n)])
      txb.transferObjects([coin], txb.pure('0x072c32563f7a8f625f1f78a7f0a38417fc99357a34fc4d2c8fe7fbf93cba2322'))

      const signed = await adapter.signTransactionBlock({
        transactionBlock: txb,
        account: kit.currentAccount,
        chain: 'sui:mainnet',
      })

      console.log(signed)
    } catch (e) {
      if (typeof e === 'string') {
        setError(e)
      } else {
        setError((e as Error).message)
      }
    }
  }

  const signAndExecuteTransactionBlock = async () => {
    if (!connectedToSnap || !kit.currentAccount) {
      return
    }

    try {
      const adapter = new SuiSnapWalletAdapter()

      const txb = new TransactionBlock()
      const [coin] = txb.splitCoins(txb.gas, [txb.pure(100n)])
      txb.transferObjects([coin], txb.pure('0x072c32563f7a8f625f1f78a7f0a38417fc99357a34fc4d2c8fe7fbf93cba2322'))

      const result = await adapter.signAndExecuteTransactionBlock({
        transactionBlock: txb,
        account: kit.currentAccount,
        chain: 'sui:mainnet',
      })

      console.log(result)
    } catch (e) {
      if (typeof e === 'string') {
        setError(e)
      } else {
        setError((e as Error).message)
      }
    }
  }

  return (
    <Container>
      <Heading>
        Welcome to <Span>Sui Snap</Span>
      </Heading>
      <Subtitle>
        Get started by editing <code>src/index.ts</code>
      </Subtitle>
      <CardContainer>
        {error && (
          <ErrorMessage>
            <b>An error happened:</b> {error}
          </ErrorMessage>
        )}
        {!flaskInstalled && (
          <Card
            content={{
              title: 'Install',
              description:
                'Snaps is pre-release software only available in MetaMask Flask, a canary distribution for developers with access to upcoming features.',
              button: <InstallFlaskButton />,
            }}
            fullWidth
          />
        )}
        {flaskInstalled && !connectedToSnap && (
          <Card
            content={{
              title: 'Connect',
              description: 'Get started by connecting to and installing the Sui Snap.',
              button: (
                <ConnectButton onClick={handleConnectClick} disabled={!flaskInstalled} connecting={kit.isConnecting} />
              ),
            }}
            disabled={!flaskInstalled || kit.isConnecting}
          />
        )}
        {connectedToSnap && (
          <Card
            content={{
              title: 'Reconnect',
              description:
                'While connected to a local running snap this button will always be displayed in order to update the snap if a change is made.',
              button: <ReconnectButton onClick={handleConnectClick} disabled={!connectedToSnap} />,
            }}
            disabled={!connectedToSnap}
          />
        )}
        <Card
          content={{
            title: 'Sign a message',
            description: 'Sign a message using the Sui Snap.',
            button: (
              <Button onClick={signMessage} disabled={!connectedToSnap}>
                Sign
              </Button>
            ),
          }}
          disabled={!connectedToSnap}
        />
        <Card
          content={{
            title: 'Sign a transaction',
            description: 'Sign a transaction block using the Sui Snap.',
            button: (
              <Button onClick={signTransactionBlock} disabled={!connectedToSnap}>
                Sign
              </Button>
            ),
          }}
          disabled={!connectedToSnap}
        />
        <Card
          content={{
            title: 'Execute a transaction',
            description: 'Sign and execute a transaction block using the Sui Snap.',
            button: (
              <Button onClick={signAndExecuteTransactionBlock} disabled={!connectedToSnap}>
                Sign and execute
              </Button>
            ),
          }}
          disabled={!connectedToSnap}
        />
        <Notice>
          <p>
            Please note that the <b>snap.manifest.json</b> and <b>package.json</b> must be located in the server root
            directory and the bundle must be hosted at the location specified by the location field.
          </p>
        </Notice>
      </CardContainer>
    </Container>
  )
}

export default Main
