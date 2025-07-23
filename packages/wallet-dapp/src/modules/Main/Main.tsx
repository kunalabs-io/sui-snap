import { useEffect, useState } from 'react'
import styled from 'styled-components'

import Dashboard from 'modules/Dashboard/Dashboard'
import Welcome from 'modules/Welcome/Welcome'
import { MetaMaskProviderInfo, getMetaMaskProvider } from '@kunalabs-io/sui-snap-wallet'
import { useCurrentWallet } from '@mysten/dapp-kit'

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
  const { isConnected, currentWallet } = useCurrentWallet()
  const [mmInfo, setMMInfo] = useState<MetaMaskProviderInfo>()

  useEffect(() => {
    getMetaMaskProvider()
      .then(info => setMMInfo(info))
      .catch(e => {
        setMMInfo(undefined)
        console.error(e)
      })
  }, [])

  const connectedToSnap = isConnected && currentWallet.name === 'Sui MetaMask Snap'
  const showDashboard = mmInfo && mmInfo.available && connectedToSnap

  return (
    <Wrapper>{showDashboard ? <Dashboard /> : <Welcome mmInfo={mmInfo} connectedToSnap={connectedToSnap} />}</Wrapper>
  )
}

export default Main
