import { useCallback, useState } from 'react'

import IconButton from 'components/IconButton/IconButton'
import { IconExplore } from 'components/Icons/IconExplore'
import { IconSend } from 'components/Icons/IconSend'
import Typography from 'components/Typography/Typography'
import { AddressContainer, AddressTypography, IconButtonContainer, StyledTypography, Tabs, TokensLabel } from './styles'
import { IconCopy } from 'components/Icons/IconCopy'
import { ellipsizeTokenAddress } from 'utils/helpers'
import { CoinInfo, useWalletBalances } from 'utils/useWalletBalances'
import { RECOGNIZED_TOKENS_PACKAGE_IDS, WALLET_BALANCES_REFETCH_INTERVAL, suiTypeArg } from 'utils/const'
import { getPackageIdFromTypeArg } from 'utils/helpers'
import { NETWORK_MAINNET, useNetwork } from 'utils/useNetworkProvider'
import { toast } from 'react-toastify'
import { formatNumberWithCommas } from 'utils/formatting'
import Spinner from 'components/Spinner/Spinner'
import { Tokens } from './Tokens'
import { Nft } from './Nft'
import { Activity } from './Activity'
import { IconGroup } from 'components/Icons/IconGroup'
import { useCurrentAccount } from '@mysten/dapp-kit'

interface Props {
  onSendClick: (selectedCoin?: CoinInfo) => void
  onStakeClick: () => void
}

enum Tab {
  Tokens = 'tokens',
  Nft = 'nft',
  Activity = 'activity',
}

const Info = ({ onSendClick, onStakeClick }: Props) => {
  const [activeTab, setActiveTab] = useState(Tab.Tokens)

  const currentAccount = useCurrentAccount()
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

  const handleStakeClick = useCallback(() => {
    if (!infos || infos.size === 0) {
      return
    }
    onStakeClick()
  }, [infos, onStakeClick])

  const handleTabChange = useCallback((tab: Tab) => {
    setActiveTab(tab)
  }, [])

  if (isLoadingWalletBalances || infos === undefined) {
    return <Spinner />
  }

  const suiCoinInfo = infos.get(suiTypeArg)

  const unrecognizedCoins: CoinInfo[] = []
  const recognizedCoins: CoinInfo[] = []

  for (const [typeArg, coinInfo] of infos.entries()) {
    if (coinInfo.amount.int === 0n) {
      continue
    }

    let isRecognized = false
    if (network === NETWORK_MAINNET) {
      const packageId = getPackageIdFromTypeArg(typeArg)
      if (RECOGNIZED_TOKENS_PACKAGE_IDS.has(packageId)) {
        isRecognized = true
      }
    }

    if (isRecognized) {
      recognizedCoins.push(coinInfo)
    } else {
      unrecognizedCoins.push(coinInfo)
    }
  }

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
          href={`https://suivision.xyz/address/${currentAccount?.address}?network=${network}`}
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

        <IconButtonContainer onClick={handleStakeClick} disabled={!infos || infos.size === 0}>
          <IconButton disabled={!infos || infos.size === 0}>
            <IconGroup />
          </IconButton>
          <StyledTypography variant="body">Stake</StyledTypography>
        </IconButtonContainer>
      </div>
      <Tabs>
        <div onClick={() => handleTabChange(Tab.Tokens)}>
          <TokensLabel variant="body" isActive={activeTab === Tab.Tokens}>
            Tokens
          </TokensLabel>
        </div>
        <div onClick={() => handleTabChange(Tab.Nft)}>
          <TokensLabel variant="body" isActive={activeTab === Tab.Nft}>
            NFT
          </TokensLabel>
        </div>
        <div onClick={() => handleTabChange(Tab.Activity)}>
          <TokensLabel variant="body" isActive={activeTab === Tab.Activity}>
            Activity
          </TokensLabel>
        </div>
      </Tabs>
      {activeTab === Tab.Tokens && (
        <Tokens unrecognizedCoins={unrecognizedCoins} recognizedCoins={recognizedCoins} onSendClick={onSendClick} />
      )}
      {activeTab === Tab.Nft && <Nft />}
      {activeTab === Tab.Activity && <Activity />}
    </div>
  )
}

export default Info
