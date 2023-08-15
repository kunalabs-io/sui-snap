import { useCallback, useState } from 'react'

import { DashboardContainer } from './styles'
import Info from 'modules/Info/Info'
import Header from 'modules/Header/Header'
import Send from 'modules/Send/Send'
import { useWalletBalances } from 'utils/useWalletBalances'
import Spinner from 'components/Spinner/Spinner'
import { REFETCH_INTERVAL } from 'utils/const'

const Dashboard = () => {
  const [showSend, setShowSend] = useState(false)

  const { infos, isLoading: isLoadingWalletBalances } = useWalletBalances({ refetchInterval: REFETCH_INTERVAL })

  const toggleSendClick = useCallback(() => {
    setShowSend(!showSend)
  }, [showSend])

  if (isLoadingWalletBalances) {
    return <Spinner />
  }

  return (
    <div>
      <Header />
      <DashboardContainer>
        <div style={{ height: 25 }} />
        {showSend ? <Send onRejectClick={toggleSendClick} /> : <Info onSendClick={toggleSendClick} infos={infos} />}
      </DashboardContainer>
    </div>
  )
}

export default Dashboard
