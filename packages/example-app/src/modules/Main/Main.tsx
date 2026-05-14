import { useEffect, useState } from 'react'
import { ConnectButton, InstallFlaskButton, ReconnectButton, Card, Button } from '../../components'
import { CardContainer, Container, ErrorMessage, Heading, Notice, Span, Subtitle } from './styles'
import {
  admin_getStoredState,
  admin_setFullnodeUrl,
  getMetaMaskProvider,
  subscribeMetaMaskProvider,
} from '@kunalabs-io/sui-snap-wallet'
import { Transaction } from '@mysten/sui/transactions'
import {
  useCurrentAccount,
  useDAppKit,
  useWalletConnection,
  useWallets,
} from '@mysten/dapp-kit-react'

function errorMessage(e: unknown): string {
  if (typeof e === 'string') return e
  if (e instanceof Error) return e.message
  return String(e)
}

const Main = () => {
  const [error, setError] = useState<string | undefined>(undefined)

  const { isConnected, isConnecting, wallet: currentWallet } = useWalletConnection()
  const dAppKit = useDAppKit()
  const wallets = useWallets()

  const [flaskInstalled, setFlaskInstalled] = useState<boolean>(false)
  useEffect(
    () =>
      subscribeMetaMaskProvider(info => {
        setFlaskInstalled(info.available && info.supportsSnaps)
      }),
    []
  )

  const currentAccount = useCurrentAccount()

  const connectedToSnap = isConnected && currentWallet?.name === 'Sui MetaMask Snap'

  const handleConnectClick = async () => {
    try {
      if (connectedToSnap) {
        await dAppKit.disconnectWallet()
      }

      const wallet = wallets.find(w => w.name === 'Sui MetaMask Snap')
      if (!wallet) {
        throw new Error('Snap wallet not found')
      }

      await dAppKit.connectWallet({ wallet })
    } catch (e) {
      setError(errorMessage(e))
      throw e
    }
  }

  const signMessage = async () => {
    if (!connectedToSnap || !currentAccount) {
      return
    }

    try {
      const result = await dAppKit.signPersonalMessage({
        message: new TextEncoder().encode('Hello World!'),
      })
      console.log(result)
    } catch (e) {
      setError(errorMessage(e))
      console.error(e)
    }
  }

  const signTransactionCb = async () => {
    if (!connectedToSnap || !currentAccount) {
      return
    }

    const txb = new Transaction()
    const [coin] = txb.splitCoins(txb.gas, [100n])
    txb.transferObjects([coin], currentAccount.address)

    try {
      const result = await dAppKit.signTransaction({ transaction: txb })
      console.log(result)
    } catch (e) {
      setError(errorMessage(e))
      console.error(e)
    }
  }

  const signAndExecuteTransactionCb = async () => {
    if (!connectedToSnap || !currentAccount) {
      return
    }

    const txb = new Transaction()
    const [coin1, coin2] = txb.splitCoins(txb.gas, [100n, 200n])
    txb.moveCall({
      target: '0x2::transfer::public_transfer',
      typeArguments: ['0x2::coin::Coin<0x2::sui::SUI>'],
      arguments: [coin1, txb.pure.address(currentAccount.address)],
    })
    txb.moveCall({
      target: '0x2::transfer::public_transfer',
      typeArguments: ['0x2::coin::Coin<0x2::sui::SUI>'],
      arguments: [coin2, txb.pure.address(currentAccount.address)],
    })

    try {
      const result = await dAppKit.signAndExecuteTransaction({ transaction: txb })
      console.log(result)
    } catch (e) {
      setError(errorMessage(e))
      console.error(e)
    }
  }

  const signBlockedAddressAliasTxCb = async () => {
    if (!connectedToSnap || !currentAccount) {
      return
    }

    const txb = new Transaction()
    txb.moveCall({
      target: '0x2::address_alias::add_alias',
      arguments: [txb.pure.address(currentAccount.address)],
    })

    try {
      const result = await dAppKit.signAndExecuteTransaction({ transaction: txb })
      console.log(result)
    } catch (e) {
      setError(errorMessage(e))
      console.error(e)
    }
  }

  const getStoredState = async () => {
    if (!connectedToSnap) {
      return
    }

    try {
      const { provider } = await getMetaMaskProvider()
      if (!provider) {
        throw new Error('MetaMask not detected')
      }
      console.log(await admin_getStoredState(provider))
    } catch (e) {
      setError(errorMessage(e))
      throw e
    }
  }

  const overrideTestnetUrl = async () => {
    if (!connectedToSnap) {
      return
    }

    try {
      const { provider } = await getMetaMaskProvider()
      if (!provider) {
        throw new Error('MetaMask not detected')
      }
      const state = await admin_getStoredState(provider)
      const newUrl =
        state.testnetUrl === 'https://fullnode.testnet.sui.io:443'
          ? 'http://localhost:9000'
          : 'https://fullnode.testnet.sui.io:443'
      await admin_setFullnodeUrl(provider, 'testnet', newUrl)
    } catch (e) {
      setError(errorMessage(e))
      throw e
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
                <ConnectButton onClick={handleConnectClick} disabled={!flaskInstalled} connecting={isConnecting} />
              ),
            }}
            disabled={!flaskInstalled || isConnecting}
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
            description: 'Sign a transaction using the Sui Snap.',
            button: (
              <Button onClick={signTransactionCb} disabled={!connectedToSnap}>
                Sign
              </Button>
            ),
          }}
          disabled={!connectedToSnap}
        />
        <Card
          content={{
            title: 'Execute a transaction',
            description: 'Sign and execute a transaction using the Sui Snap.',
            button: (
              <Button onClick={signAndExecuteTransactionCb} disabled={!connectedToSnap}>
                Sign and execute
              </Button>
            ),
          }}
          disabled={!connectedToSnap}
        />
        <Card
          content={{
            title: 'Try blocked transaction (0x2::address_alias)',
            description:
              'Attempts to sign and execute a PTB that calls into 0x2::address_alias. The snap should refuse to sign it and surface a block dialog — verify the rejection.',
            button: (
              <Button onClick={signBlockedAddressAliasTxCb} disabled={!connectedToSnap}>
                Try blocked
              </Button>
            ),
          }}
          disabled={!connectedToSnap}
        />
        <Card
          content={{
            title: 'Admin get stored state',
            description: 'Get the stored state of the Snap.',
            button: (
              <Button onClick={getStoredState} disabled={!connectedToSnap}>
                Get
              </Button>
            ),
          }}
          disabled={!connectedToSnap}
        />
        <Card
          content={{
            title: 'Admin override testnet RPC URL',
            description: 'Override the testnet RPC URL.',
            button: (
              <Button onClick={overrideTestnetUrl} disabled={!connectedToSnap}>
                Override
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
