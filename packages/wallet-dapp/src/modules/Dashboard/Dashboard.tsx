import { useCallback, useState } from 'react'

import { DashboardContainer } from './styles'
import Info from 'modules/Info/Info'
import Header from 'modules/Header/Header'
import Send from 'modules/Send/Send'

const Dashboard = () => {
  const [showSend, setShowSend] = useState(false)

  const toggleSendClick = useCallback(() => {
    setShowSend(!showSend)
  }, [showSend])

  return (
    <div>
      <Header />
      <DashboardContainer>
        <div style={{ height: 25 }} />
        {showSend ? <Send onRejectClick={toggleSendClick} /> : <Info onSendClick={toggleSendClick} />}
      </DashboardContainer>
    </div>
  )
}

export default Dashboard
