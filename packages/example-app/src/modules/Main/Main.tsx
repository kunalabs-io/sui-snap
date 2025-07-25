import { useEffect, useState } from 'react'
import { ConnectButton, InstallFlaskButton, ReconnectButton, Card, Button } from '../../components'
import { CardContainer, Container, ErrorMessage, Heading, Notice, Span, Subtitle } from './styles'
import { admin_getStoredState, admin_setFullnodeUrl, getMetaMaskProvider } from '@kunalabs-io/sui-snap-wallet'
import { TransactionBlock } from '@mysten/sui.js/transactions'
import {
  useConnectWallet,
  useCurrentAccount,
  useCurrentWallet,
  useDisconnectWallet,
  useSignPersonalMessage,
  useSignTransactionBlock,
  useWallets,
} from '@mysten/dapp-kit'

const Main = () => {
  const [error, setError] = useState<string | undefined>(undefined)

  const { isConnected, currentWallet, isConnecting } = useCurrentWallet()
  const { mutate: disconnect } = useDisconnectWallet()
  const { mutate: connect } = useConnectWallet()
  const wallets = useWallets()

  const [flaskInstalled, setFlaskInstalled] = useState<boolean>(false)
  useEffect(() => {
    getMetaMaskProvider()
      .then(metamaskInfo => {
        console.log(metamaskInfo.provider?.request({ method: 'wallet_getSnaps' }).then(console.log))
        setFlaskInstalled(metamaskInfo.available && metamaskInfo.supportsSnaps)
      })
      .catch(e => {
        setFlaskInstalled(false)
        console.error(e)
      })
  }, [])

  const currentAccount = useCurrentAccount()

  const { mutate: signPersonalMessage } = useSignPersonalMessage()
  const { mutate: signTransactionBlock } = useSignTransactionBlock()
  const { mutate: signAndExecuteTransactionBlock } = useSignTransactionBlock()

  const connectedToSnap = isConnected && currentWallet?.name === 'Sui MetaMask Snap'

  const handleConnectClick = async () => {
    if (connectedToSnap) {
      disconnect()
    }

    const wallet = wallets.find(wallet => wallet.name === 'Sui MetaMask Snap')
    if (!wallet) {
      throw new Error('Snap wallet not found')
    }

    try {
      connect({ wallet })
    } catch (e) {
      if (typeof e === 'string') {
        setError(e)
      } else {
        setError((e as Error).message)
      }
      throw e
    }
  }

  const signMessage = async () => {
    if (!connectedToSnap || !currentAccount) {
      return
    }

    signPersonalMessage(
      {
        // message: new Uint8Array([1, 2, 3]),
        message: new TextEncoder().encode('Hello World!'),
        account: currentAccount,
      },
      {
        onSuccess: result => {
          console.log(result)
        },
        onError: e => {
          if (typeof e === 'string') {
            setError(e)
          } else {
            setError((e as Error).message)
          }
          console.error(e)
        },
      }
    )
  }

  const signTransactionBlockCb = async () => {
    if (!connectedToSnap || !currentAccount) {
      return
    }

    const txb = new TransactionBlock()
    const [coin] = txb.splitCoins(txb.gas, [txb.pure(100n)])
    txb.transferObjects([coin], txb.pure(currentAccount.address))

    signTransactionBlock(
      {
        transactionBlock: txb,
        chain: 'sui:testnet',
      },
      {
        onSuccess: result => {
          console.log(result)
        },
        onError: e => {
          if (typeof e === 'string') {
            setError(e)
          } else {
            setError((e as Error).message)
          }
          console.error(e)
        },
      }
    )
  }

  const signAndExecuteTransactionBlockCb = async () => {
    if (!connectedToSnap || !currentAccount) {
      return
    }

    const txb = new TransactionBlock()
    const [coin1, coin2] = txb.splitCoins(txb.gas, [txb.pure(100n), txb.pure(200n)])
    txb.moveCall({
      target: '0x2::transfer::public_transfer',
      typeArguments: ['0x2::coin::Coin<0x2::sui::SUI>'],
      arguments: [coin1, txb.pure(currentAccount.address)],
    })
    txb.moveCall({
      target: '0x2::transfer::public_transfer',
      typeArguments: ['0x2::coin::Coin<0x2::sui::SUI>'],
      arguments: [coin2, txb.pure(currentAccount.address)],
    })

    signAndExecuteTransactionBlock(
      {
        transactionBlock: txb,
        chain: 'sui:testnet',
      },
      {
        onSuccess: result => {
          console.log(result)
        },
        onError: e => {
          if (typeof e === 'string') {
            setError(e)
          } else {
            setError((e as Error).message)
          }
          console.error(e)
        },
      }
    )
  }

  const getStoredState = async () => {
    if (!connectedToSnap) {
      return
    }

    try {
      console.log(await admin_getStoredState(window.ethereum))
    } catch (e) {
      if (typeof e === 'string') {
        setError(e)
      } else {
        setError((e as Error).message)
      }
      throw e
    }
  }

  const overrideTestnetUrl = async () => {
    if (!connectedToSnap) {
      return
    }

    try {
      const state = await admin_getStoredState(window.ethereum)
      const newUrl =
        state.testnetUrl === 'https://fullnode.testnet.sui.io:443'
          ? 'http://localhost:9000'
          : 'https://fullnode.testnet.sui.io:443'
      await admin_setFullnodeUrl(window.ethereum, 'testnet', newUrl)
    } catch (e) {
      if (typeof e === 'string') {
        setError(e)
      } else {
        setError((e as Error).message)
      }
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
            description: 'Sign a transaction block using the Sui Snap.',
            button: (
              <Button onClick={signTransactionBlockCb} disabled={!connectedToSnap}>
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
              <Button onClick={signAndExecuteTransactionBlockCb} disabled={!connectedToSnap}>
                Sign and execute
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
