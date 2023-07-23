import { useContext } from 'react'
import { MetamaskActions, MetaMaskContext } from '../../hooks'
import { connectSnap, getSnap, sendHello, shouldDisplayReconnectButton } from '../../utils'
import { ConnectButton, InstallFlaskButton, ReconnectButton, SendHelloButton, Card } from '../../components'
import { CardContainer, Container, ErrorMessage, Heading, Notice, Span, Subtitle } from './styles'

const Main = () => {
  const [state, dispatch] = useContext(MetaMaskContext)

  const handleConnectClick = async () => {
    try {
      await connectSnap()
      const installedSnap = await getSnap()

      dispatch({
        type: MetamaskActions.SetInstalled,
        payload: installedSnap,
      })
    } catch (e) {
      console.error(e)
      dispatch({ type: MetamaskActions.SetError, payload: e })
    }
  }

  const handleSendHelloClick = async () => {
    try {
      await sendHello()
    } catch (e) {
      console.error(e)
      dispatch({ type: MetamaskActions.SetError, payload: e })
    }
  }

  return (
    <Container>
      <Heading>
        Welcome to <Span>template-snap</Span>
      </Heading>
      <Subtitle>
        Get started by editing <code>src/index.ts</code>
      </Subtitle>
      <CardContainer>
        {state.error && (
          <ErrorMessage>
            <b>An error happened:</b> {state.error.message}
          </ErrorMessage>
        )}
        {!state.isFlask && (
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
        {!state.installedSnap && (
          <Card
            content={{
              title: 'Connect',
              description: 'Get started by connecting to and installing the example snap.',
              button: <ConnectButton onClick={handleConnectClick} disabled={!state.isFlask} />,
            }}
            disabled={!state.isFlask}
          />
        )}
        {shouldDisplayReconnectButton(state.installedSnap) && (
          <Card
            content={{
              title: 'Reconnect',
              description:
                'While connected to a local running snap this button will always be displayed in order to update the snap if a change is made.',
              button: <ReconnectButton onClick={handleConnectClick} disabled={!state.installedSnap} />,
            }}
            disabled={!state.installedSnap}
          />
        )}
        <Card
          content={{
            title: 'Send Hello message',
            description: 'Display a custom message within a confirmation screen in MetaMask.',
            button: <SendHelloButton onClick={handleSendHelloClick} disabled={!state.installedSnap} />,
          }}
          disabled={!state.installedSnap}
          fullWidth={
            state.isFlask && Boolean(state.installedSnap) && !shouldDisplayReconnectButton(state.installedSnap)
          }
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
