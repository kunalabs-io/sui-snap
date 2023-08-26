import { useEffect, useState } from 'react'
import { useWalletKit } from '@mysten/wallet-kit'
import styled from 'styled-components'

import Dashboard from 'modules/Dashboard/Dashboard'
import Welcome from 'modules/Welcome/Welcome'
import { FlaskStatus, flaskAvailable } from '@kunalabs-io/sui-snap-wallet'

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

  const [flaskStatus, setFlaskStatus] = useState<FlaskStatus>()

  useEffect(() => {
    flaskAvailable()
      .then(status => setFlaskStatus(status))
      .catch(e => {
        setFlaskStatus(undefined)
        console.error(e)
      })
  }, [])

  const connectedToSnap = kit.isConnected && kit.currentWallet?.name === 'Sui MetaMask Snap'
  const showDashboard = flaskStatus && flaskStatus.flaskAvailable && connectedToSnap

  return (
    <Wrapper>
      {showDashboard ? <Dashboard /> : <Welcome flaskStatus={flaskStatus} connectedToSnap={connectedToSnap} />}
    </Wrapper>
  )
}

export default Main
