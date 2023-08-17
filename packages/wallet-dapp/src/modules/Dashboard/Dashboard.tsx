import { useCallback, useState } from 'react'

import { DashboardContainer } from './styles'
import Info from 'modules/Info/Info'
import Header from 'modules/Header/Header'
import Send from 'modules/Send/Send'
import { CoinInfo, useWalletBalances } from 'utils/useWalletBalances'
import Spinner from 'components/Spinner/Spinner'
import { REFETCH_INTERVAL, suiTypeArg } from 'utils/const'

const Dashboard = () => {
  const [showSend, setShowSend] = useState(false)
  const [selectedTokenToSend, setSelectedTokenToSend] = useState<CoinInfo>()

  const { infos, isLoading: isLoadingWalletBalances } = useWalletBalances({ refetchInterval: REFETCH_INTERVAL })

  const toggleSendClick = useCallback(() => {
    setShowSend(!showSend)
    setSelectedTokenToSend(infos?.get(suiTypeArg))
  }, [showSend, infos])

  const handleCoinInfoClick = useCallback((coinInfo: CoinInfo) => {
    setSelectedTokenToSend(coinInfo)
    setShowSend(true)
  }, [])

  if (isLoadingWalletBalances) {
    return <Spinner />
  }

  return (
    <div>
      <Header />
      <DashboardContainer>
        <div style={{ height: 25 }} />
        {showSend ? (
          <Send onRejectClick={toggleSendClick} infos={infos} initialCoinInfo={selectedTokenToSend} />
        ) : (
          <Info onSendClick={toggleSendClick} infos={infos} onCoinClick={handleCoinInfoClick} />
        )}
      </DashboardContainer>
    </div>
  )
}

export default Dashboard
