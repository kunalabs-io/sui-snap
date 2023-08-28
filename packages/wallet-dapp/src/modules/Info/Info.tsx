import { useCallback } from 'react'
import { useWalletKit } from '@mysten/wallet-kit'

import IconButton from 'components/IconButton/IconButton'
import { IconExplore } from 'components/Icons/IconExplore'
import { IconSend } from 'components/Icons/IconSend'
import Typography from 'components/Typography/Typography'
import { AddressContainer, AddressTypography, IconButtonContainer, StyledTypography, TokensLabel } from './styles'
import CoinItem from './CoinItem'
import { IconCopy } from 'components/Icons/IconCopy'
import { ellipsizeTokenAddress } from 'utils/helpers'
import { CoinInfo, useWalletBalances } from 'utils/useWalletBalances'
import { RECOGNIZED_TOKENS_PACKAGE_IDS, WALLET_BALANCES_REFETCH_INTERVAL, suiTypeArg } from 'utils/const'
import { getPackageIdFromTypeArg } from 'utils/helpers'
import Accordion from 'components/Accordion/Accordion'
import { NETWORK_MAINNET, useNetwork } from 'utils/useNetworkProvider'
import { toast } from 'react-toastify'
import { formatNumberWithCommas } from 'utils/formatting'
import Spinner from 'components/Spinner/Spinner'

interface Props {
  onSendClick: (selectedCoin?: CoinInfo) => void
}

const Info = ({ onSendClick }: Props) => {
  const { currentAccount } = useWalletKit()
  const { network } = useNetwork()

  const handleAddressClick = useCallback(async () => {
    await navigator.clipboard.writeText(currentAccount?.address || '')
    toast.success('Address copied')
  }, [currentAccount?.address])

  const { infos, isLoading: isLoadingWalletBalances } = useWalletBalances({
    refetchInterval: WALLET_BALANCES_REFETCH_INTERVAL,
  })

  const handleSendClick = useCallback(() => {
    if (!infos || infos.size === 0) {
      return
    }
    onSendClick()
  }, [infos, onSendClick])

  if (isLoadingWalletBalances || infos === undefined) {
    return <Spinner />
  }

  const suiCoinInfo = infos.get(suiTypeArg)

  const infosKeys = [...infos.keys()]
  const unrecognizedCoins: CoinInfo[] = []
  const recognizedCoins: CoinInfo[] = []

  infosKeys.forEach(typeArg => {
    if (network === NETWORK_MAINNET) {
      const packageId = getPackageIdFromTypeArg(typeArg)
      if (RECOGNIZED_TOKENS_PACKAGE_IDS.has(packageId)) {
        recognizedCoins.push(infos.get(typeArg)!)
      } else {
        unrecognizedCoins.push(infos.get(typeArg)!)
      }
    } else {
      if (typeArg === suiTypeArg) {
        recognizedCoins.push(infos.get(typeArg)!)
      } else {
        unrecognizedCoins.push(infos.get(typeArg)!)
      }
    }
  })

  return (
    <div style={{ marginTop: 25 }}>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <AddressContainer onClick={handleAddressClick}>
          <AddressTypography variant="body-description" color="primary">
            {ellipsizeTokenAddress(currentAccount?.address || '')}
            <IconCopy />
          </AddressTypography>
        </AddressContainer>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'end', marginTop: 25 }}>
        {typeof suiCoinInfo === 'undefined' ? (
          <>
            <Typography variant="title" style={{ marginRight: 8 }} fontWeight="medium">
              0
            </Typography>
            <Typography variant="subtitle1" color="secondary" style={{ marginBottom: 3 }} fontWeight="medium">
              SUI
            </Typography>
          </>
        ) : (
          <>
            <Typography variant="title" style={{ marginRight: 8 }} fontWeight="medium">
              {formatNumberWithCommas(suiCoinInfo?.amount.toString())}
            </Typography>
            <Typography variant="subtitle1" color="secondary" style={{ marginBottom: 3 }} fontWeight="medium">
              {suiCoinInfo?.meta.symbol}
            </Typography>
          </>
        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: 25, gap: 20 }}>
        <IconButtonContainer onClick={handleSendClick} disabled={!infos || infos.size === 0}>
          <IconButton disabled={!infos || infos.size === 0}>
            <IconSend />
          </IconButton>
          <StyledTypography variant="body">Send</StyledTypography>
        </IconButtonContainer>

        <a
          href={`https://suiexplorer.com/address/${currentAccount?.address}?network=${network}`}
          target="_blank"
          rel="noreferrer"
          style={{ textDecoration: 'none' }}
        >
          <IconButtonContainer>
            <IconButton>
              <IconExplore />
            </IconButton>
            <StyledTypography variant="body">Explorer</StyledTypography>
          </IconButtonContainer>
        </a>
      </div>
      <div style={{ marginTop: 25, marginBottom: 8, textAlign: 'center', padding: '0 14px' }}>
        <TokensLabel variant="body">Tokens</TokensLabel>
      </div>
      <div>
        {recognizedCoins.map(c => (
          <CoinItem coinInfo={c} key={c.meta.typeArg} onCoinClick={onSendClick} />
        ))}
      </div>
      {unrecognizedCoins.length ? (
        <Accordion
          isOpenInitial
          accordionSummary={`${unrecognizedCoins.length} Unrecognized Token${unrecognizedCoins.length > 1 ? 's' : ''}`}
          accordionSummaryStyles={{ padding: '0 14px' }}
          accordionDetails={
            <div style={{ marginTop: 10 }}>
              {unrecognizedCoins.map(c => (
                <CoinItem coinInfo={c} key={c.meta.typeArg} onCoinClick={onSendClick} />
              ))}
            </div>
          }
        />
      ) : null}
    </div>
  )
}

export default Info
