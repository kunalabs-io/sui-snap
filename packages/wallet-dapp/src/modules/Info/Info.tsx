import IconButton from 'components/IconButton/IconButton'
import { IconExplore } from 'components/Icons/IconExplore'
import { IconSend } from 'components/Icons/IconSend'
import Typography from 'components/Typography/Typography'
import { AddressContainer, AddressTypography, IconButtonContainer, StyledTypography, TokensLabel } from './styles'
import Accordion from 'components/Accordion/Accordion'
import CoinItem from './CoinItem'
import { IconCopy } from 'components/Icons/IconCopy'
import { ellipsizeTokenAddress } from 'utils/tokenAddress'

interface Props {
  onSendClick: () => void
}

const mockedCoins = [
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
]

const mockedUnrecognizedCoins = [
  {
    name: 'SuiBoxer SuiBoxer',
    symbol: 'SBOX',
    amount: '300',
  },
]

const mockedAddress = '0xcc2bd176a478baea9a0de7a24cd927661cc6e860d5bacecb9a138ef20dbab231'

const Info = ({ onSendClick }: Props) => {
  const handleIconButtonClick = () => {
    console.log('handleIconButtonClick')
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <AddressContainer>
          <AddressTypography variant="body" color="primary">
            {ellipsizeTokenAddress(mockedAddress)}
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
          <IconButton onClick={onSendClick}>
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
      <div>
        {mockedCoins.map(c => (
          <CoinItem coin={c} key={c.symbol} />
        ))}
      </div>
      <Accordion
        isOpenInitial
        accordionSummary={`${mockedUnrecognizedCoins.length} Unrecognized Token`}
        accordionDetails={
          <div style={{ marginTop: 10 }}>
            {mockedUnrecognizedCoins.map(c => (
              <CoinItem coin={c} key={c.symbol} />
            ))}
          </div>
        }
      />
    </div>
  )
}

export default Info
