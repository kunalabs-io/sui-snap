import { useCallback, useEffect, useState } from 'react'

import { DashboardContainer } from './styles'
import Info from 'modules/Info/Info'
import Header from 'modules/Header/Header'
import Send from 'modules/Send/Send'
import { CoinInfo } from 'utils/useWalletBalances'
import { useNetwork } from 'utils/useNetworkProvider'
import { Stake } from 'modules/Stake/Stake'

const Dashboard = () => {
  const [currentScreen, setCurrentScreen] = useState<'info' | 'send' | 'stake'>('info')
  const [selectedTokenToSend, setSelectedTokenToSend] = useState<CoinInfo>()

  const { network } = useNetwork()

  useEffect(() => {
    setCurrentScreen('info')
  }, [network])

  const handleSendClick = useCallback((selectedCoin?: CoinInfo) => {
    setSelectedTokenToSend(selectedCoin)
    setCurrentScreen('send')
  }, [])

  const handleStakeClick = useCallback(() => {
    setCurrentScreen('stake')
  }, [])

  const openInfoScreen = useCallback(() => {
    setCurrentScreen('info')
  }, [])

  return (
    <div>
      <Header />
      <DashboardContainer>
        {currentScreen === 'send' ? (
          <Send openInfoScreen={openInfoScreen} initialCoinInfo={selectedTokenToSend} />
        ) : currentScreen === 'info' ? (
          <Info onSendClick={handleSendClick} onStakeClick={handleStakeClick} />
        ) : (
          <Stake onBackClick={openInfoScreen} />
        )}
      </DashboardContainer>
    </div>
  )
}

export default Dashboard
