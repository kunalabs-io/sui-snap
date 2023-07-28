import { ellipsizeTokenAddress } from 'utils/tokenAddress'
import {
  AddressContainer,
  AddressTypography,
  DashboardContainer,
  IconButtonContainer,
  StyledTypography,
  TokensLabel,
} from './styles'
import { IconCopy } from 'components/Icons/IconCopy'
import Typography from 'components/Typography/Typography'
import IconButton from 'components/IconButton/IconButton'
import { IconSend } from 'components/Icons/IconSend'
import { IconExplore } from 'components/Icons/IconExplore'
import CoinList from './CoinList'
import UnrecognizedTokens from './UnrecognizedTokens'

const address = '0xcc2bd176a478baea9a0de7a24cd927661cc6e860d5bacecb9a138ef20dbab231'

const Dashboard = () => {
  const handleIconButtonClick = () => {
    console.log('handleIconButtonClick')
  }

  return (
    <DashboardContainer>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <AddressContainer>
          <AddressTypography variant="body" color="primary">
            {ellipsizeTokenAddress(address)}
            <IconCopy />
          </AddressTypography>
        </AddressContainer>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: 25 }}>
        <Typography variant="title" style={{ marginRight: 8 }}>
          1,443.96
        </Typography>
        <Typography variant="subtitle1" color="secondary">
          SUI
        </Typography>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: 25, gap: 20 }}>
        <IconButtonContainer>
          <IconButton onClick={handleIconButtonClick}>
            <IconSend />
          </IconButton>
          <StyledTypography variant="body">Send</StyledTypography>
        </IconButtonContainer>
        <IconButtonContainer>
          <IconButton onClick={handleIconButtonClick}>
            <IconExplore />
          </IconButton>
          <StyledTypography variant="body">Explorer</StyledTypography>
        </IconButtonContainer>
      </div>
      <div style={{ marginTop: 25, textAlign: 'center' }}>
        <TokensLabel variant="body">Tokens</TokensLabel>
      </div>
      <CoinList
        coins={[
          {
            name: 'Sui',
            symbol: 'SUI',
            amount: '1,443.96',
          },

          {
            name: 'Tether',
            symbol: 'USDT',
            amount: '250.00',
          },
        ]}
      />
      <div style={{ height: 12 }} />
      <UnrecognizedTokens
        coins={[
          {
            name: 'SuiBoxer SuiBoxer',
            symbol: 'SBOX',
            amount: '300',
          },
        ]}
      />
    </DashboardContainer>
  )
}

export default Dashboard
