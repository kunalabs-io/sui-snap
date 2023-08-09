import IconButton from 'components/IconButton/IconButton'
import { IconExplore } from 'components/Icons/IconExplore'
import { IconSend } from 'components/Icons/IconSend'
import Typography from 'components/Typography/Typography'
import { AddressContainer, AddressTypography, IconButtonContainer, StyledTypography, TokensLabel } from './styles'
import CoinItem from './CoinItem'
import { IconCopy } from 'components/Icons/IconCopy'
import { ellipsizeTokenAddress } from 'utils/tokenAddress'
import { CoinInfo } from 'utils/useWalletBalances'
import { suiTypeArg, walletAddress } from 'utils/const'

interface Props {
  onSendClick: () => void
  infos: Map<string, CoinInfo> | undefined
}

const Info = ({ onSendClick, infos }: Props) => {
  const handleIconButtonClick = () => {
    console.log('handleIconButtonClick')
  }

  if (typeof infos === 'undefined') {
    return null
  }

  const suiCoinInfo = infos.get(suiTypeArg)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <AddressContainer>
          <AddressTypography variant="body" color="primary">
            {ellipsizeTokenAddress(walletAddress)}
            <IconCopy />
          </AddressTypography>
        </AddressContainer>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: 25 }}>
        <Typography variant="title" style={{ marginRight: 8 }}>
          {suiCoinInfo?.amount.toString()}
        </Typography>
        <Typography variant="subtitle1" color="secondary">
          {suiCoinInfo?.meta.symbol}
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
        {[...infos.keys()].map(coinType => (
          <CoinItem coinInfo={infos.get(coinType)} key={coinType} />
        ))}
      </div>
      {/* <Accordion
        isOpenInitial
        accordionSummary={`${mockedUnrecognizedCoins.length} Unrecognized Token`}
        accordionDetails={
          <div style={{ marginTop: 10 }}>
            {mockedUnrecognizedCoins.map(c => (
              <CoinItem coin={c} key={c.symbol} />
            ))}
          </div>
        }
      /> */}
    </div>
  )
}

export default Info
