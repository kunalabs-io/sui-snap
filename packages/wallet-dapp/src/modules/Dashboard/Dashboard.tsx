import { useState } from 'react'

import { DashboardContainer } from './styles'
import Info from 'modules/Info/Info'
import Header from 'modules/Header/Header'
import Send from 'modules/Send/Send'
import { CoinInfo } from 'utils/useWalletBalances'

const Dashboard = () => {
  const [currentScreen, setCurrentScreen] = useState<'info' | 'send'>('info')
  const [selectedTokenToSend, setSelectedTokenToSend] = useState<CoinInfo>()

  const handleSendClick = (selectedCoin?: CoinInfo) => {
    setSelectedTokenToSend(selectedCoin)
    setCurrentScreen('send')
  }

  const openInfoScreen = () => {
    setCurrentScreen('info')
  }

  return (
    <div>
      <Header />
      <DashboardContainer>
        <div style={{ height: 25 }} />
        {currentScreen == 'send' ? (
          <Send openInfoScreen={openInfoScreen} initialCoinInfo={selectedTokenToSend} />
        ) : (
          <Info onSendClick={handleSendClick} />
        )}
      </DashboardContainer>
    </div>
  )
}

export default Dashboard
