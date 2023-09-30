import { useEffect, useState } from 'react'
import { useWalletKit } from '@mysten/wallet-kit'
import styled from 'styled-components'

import Dashboard from 'modules/Dashboard/Dashboard'
import Welcome from 'modules/Welcome/Welcome'
import { MetaMaskStatus, metaMaskAvailable } from '@kunalabs-io/sui-snap-wallet'

const Wrapper = styled.div`
  background-color: ${p => p.theme.colors.background.primary};
  margin-left: auto;
  margin-right: auto;
  margin-top: 100px;
  width: 360px;
  height: 553px;
  border: 1px solid ${p => p.theme.colors.divider};
  border-radius: 7px;
`

const Main = () => {
  const kit = useWalletKit()

  const [mmStatus, setMMStatus] = useState<MetaMaskStatus>()

  useEffect(() => {
    metaMaskAvailable()
      .then(status => setMMStatus(status))
      .catch(e => {
        setMMStatus(undefined)
        console.error(e)
      })
  }, [])

  const connectedToSnap = kit.isConnected && kit.currentWallet?.name === 'Sui MetaMask Snap'
  const showDashboard = mmStatus && mmStatus.available && connectedToSnap

  return (
    <Wrapper>
      {showDashboard ? <Dashboard /> : <Welcome mmStatus={mmStatus} connectedToSnap={connectedToSnap} />}
    </Wrapper>
  )
}

export default Main
