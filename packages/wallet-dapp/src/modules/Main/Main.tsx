import { useEffect, useState } from 'react'
import { useWalletKit } from '@mysten/wallet-kit'
import styled from 'styled-components'

import Dashboard from 'modules/Dashboard/Dashboard'
import Welcome from 'modules/Welcome/Welcome'
import { flaskAvailable } from '@kunalabs-io/sui-snap-wallet'

const Wrapper = styled.div`
  background-color: ${p => p.theme.colors.background.primary};
  margin-left: auto;
  margin-right: auto;
  margin-top: 100px;
  width: 360px;
  height: 553px;
  border: 1px solid ${p => p.theme.colors.divider};
  border-radius: 7px;
  overflow: auto;
`

const Main = () => {
  const kit = useWalletKit()

  const [flaskInstalled, setFlaskInstalled] = useState<boolean>(false)

  useEffect(() => {
    flaskAvailable()
      .then((isAvailable?: boolean) => setFlaskInstalled(!!isAvailable))
      .catch(e => {
        setFlaskInstalled(false)
        console.error(e)
      })
  }, [])

  const connectedToSnap = kit.isConnected && kit.currentWallet?.name === 'Sui MetaMask Snap'

  const showWelcomeScreen = !flaskInstalled || !connectedToSnap
  return (
    <Wrapper>
      {showWelcomeScreen ? (
        <Welcome flaskInstalled={flaskInstalled} connectedToSnap={connectedToSnap} />
      ) : (
        <Dashboard />
      )}
    </Wrapper>
  )
}

export default Main
