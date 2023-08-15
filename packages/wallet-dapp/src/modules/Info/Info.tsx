import { useWalletKit } from '@mysten/wallet-kit'

import IconButton from 'components/IconButton/IconButton'
import { IconExplore } from 'components/Icons/IconExplore'
import { IconSend } from 'components/Icons/IconSend'
import Typography from 'components/Typography/Typography'
import { AddressContainer, AddressTypography, IconButtonContainer, StyledTypography, TokensLabel } from './styles'
import CoinItem from './CoinItem'
import { IconCopy } from 'components/Icons/IconCopy'
import { ellipsizeTokenAddress } from 'utils/helpers'
import { CoinInfo } from 'utils/useWalletBalances'
import { RECOGNIZED_TOKENS_PACKAGE_IDS, suiTypeArg } from 'utils/const'
import { getPackageIdFromTypeArg } from 'utils/helpers'
import Accordion from 'components/Accordion/Accordion'

interface Props {
  onSendClick: () => void
  infos: Map<string, CoinInfo> | undefined
}

const Info = ({ onSendClick, infos }: Props) => {
  const { currentAccount } = useWalletKit()
  const handleIconButtonClick = () => {
    console.log('handleIconButtonClick')
  }

  if (typeof infos === 'undefined') {
    return null
  }

  const suiCoinInfo = infos.get(suiTypeArg)

  const infosKeys = [...infos.keys()]
  const unrecognizedCoins: CoinInfo[] = []
  const recognizedCoins: CoinInfo[] = []

  infosKeys.forEach(typeArg => {
    const packageId = getPackageIdFromTypeArg(typeArg)
    if (RECOGNIZED_TOKENS_PACKAGE_IDS.has(packageId)) {
      recognizedCoins.push(infos.get(typeArg)!)
    } else {
      unrecognizedCoins.push(infos.get(typeArg)!)
    }
  })

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <AddressContainer>
          <AddressTypography variant="body" color="primary">
            {ellipsizeTokenAddress(currentAccount?.address || '')}
            <IconCopy />
          </AddressTypography>
        </AddressContainer>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: 25 }}>
        {typeof suiCoinInfo === 'undefined' ? (
          <>
            <Typography variant="title" style={{ marginRight: 8 }}>
              0
            </Typography>
            <Typography variant="subtitle1" color="secondary">
              SUI
            </Typography>
          </>
        ) : (
          <>
            <Typography variant="title" style={{ marginRight: 8 }}>
              {suiCoinInfo?.amount.toString()}
            </Typography>
            <Typography variant="subtitle1" color="secondary">
              {suiCoinInfo?.meta.symbol}
            </Typography>
          </>
        )}
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
        {recognizedCoins.map(c => (
          <CoinItem coinInfo={c} key={c.meta.typeArg} />
        ))}
      </div>
      {unrecognizedCoins.length ? (
        <Accordion
          isOpenInitial
          accordionSummary={`${unrecognizedCoins.length} Unrecognized Token`}
          accordionDetails={
            <div style={{ marginTop: 10 }}>
              {unrecognizedCoins.map(c => (
                <CoinItem coinInfo={c} key={c.meta.typeArg} />
              ))}
            </div>
          }
        />
      ) : null}
    </div>
  )
}

export default Info
