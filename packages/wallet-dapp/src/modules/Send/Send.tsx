import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import Input from 'components/Input/Input'
import { SendLabel, SubmitButtonsContainer } from './styles'
import Button from 'components/Button/Button'
import TokenSelect from './TokenSelect'
import { CoinInfo, useWalletBalances } from 'utils/useWalletBalances'
import { useInputAmountValidate } from 'utils/input/useInputAmountValidate'
import { toast } from 'react-toastify'
import { WALLET_BALANCES_REFETCH_INTERVAL } from 'utils/const'
import Spinner from 'components/Spinner/Spinner'
import { useSuiClientProvider } from 'utils/useSuiClientProvider'
import { useWalletKit } from '@mysten/wallet-kit'
import { TransactionArgument, TransactionBlock } from '@mysten/sui.js/transactions'
import { SUI_TYPE_ARG } from '@mysten/sui.js/utils'
import { useNetwork } from 'utils/useNetworkProvider'
import { UserRejectionError } from '@kunalabs-io/sui-snap-wallet-adapter'
import Textarea from 'components/Textarea/Textarea'
import { useAutoSizeTextarea } from 'utils/useAutoSizeTextarea'

interface Props {
  openInfoScreen: () => void
  initialCoinInfo: CoinInfo | undefined
}

function isValidSuiAddress(value: string): boolean {
  return /^0x[a-fA-F0-9]+$/.test(value) && value.length - 2 <= 64
}

const Send = ({ openInfoScreen, initialCoinInfo }: Props) => {
  const [recipient, setRecipient] = useState('')
  const [rawInputStr, setRawInputStr] = useState('')
  const [selectedCoin, setSelectedCoin] = useState<CoinInfo | undefined>(initialCoinInfo)
  const [isSending, setIsSending] = useState(false)

  const textAreaRef = useRef<HTMLTextAreaElement>(null)

  useAutoSizeTextarea(textAreaRef.current, recipient)

  const {
    infos,
    isLoading: isLoadingWalletBalances,
    triggerUpdate: triggerWalletBalancesUpdate,
  } = useWalletBalances({
    refetchInterval: WALLET_BALANCES_REFETCH_INTERVAL,
  })

  const { sanitizedInputValue, amount } = useInputAmountValidate(rawInputStr, selectedCoin?.meta.decimals || 0)

  useEffect(() => {
    setSelectedCoin(initialCoinInfo)
  }, [initialCoinInfo])

  const handleAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setRawInputStr(e.target.value)
  }, [])

  const handleMaxClick = useCallback(() => {
    if (!selectedCoin) {
      return
    }
    setRawInputStr(selectedCoin.amount.toString())
  }, [selectedCoin])

  const options = useMemo(() => {
    if (!infos) {
      return []
    }
    return Array.from(infos.values())
  }, [infos])

  const handleRecipientChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setRecipient(e.target.value)
  }, [])

  const handleCoinChange = useCallback((coin: CoinInfo) => {
    setSelectedCoin(coin)
  }, [])

  let sendEnabled = false
  if (
    recipient &&
    isValidSuiAddress(recipient) &&
    amount &&
    selectedCoin &&
    amount.int > 0n &&
    amount.int <= selectedCoin.amount.int &&
    amount.decimals === (selectedCoin.meta.decimals || 0)
  ) {
    sendEnabled = true
  }

  const client = useSuiClientProvider()
  const walletKit = useWalletKit()
  const { network, chain } = useNetwork()

  const onSendClick = useCallback(async () => {
    setIsSending(true)
    // invariants
    if (!recipient || !amount || !selectedCoin || !walletKit.currentAccount) {
      toast.error('Something went wrong')
      return
    }

    const address = walletKit.currentAccount.address

    let coin: TransactionArgument
    const txb = new TransactionBlock()

    if (selectedCoin.meta.typeArg === SUI_TYPE_ARG) {
      coin = txb.splitCoins(txb.gas, [txb.pure(amount.int)])
    } else {
      let acc = 0n
      const coinIds = []
      let cursor = undefined
      let hasNextPage = true
      while (hasNextPage && acc < amount.int) {
        const coinsResult = await client.getCoins({
          owner: address,
          coinType: selectedCoin.meta.typeArg,
          cursor,
        })
        for (const coin of coinsResult.data) {
          acc += BigInt(coin.balance)
          coinIds.push(coin.coinObjectId)
          if (acc >= amount.int) {
            break
          }
        }
        cursor = coinsResult.nextCursor
        hasNextPage = coinsResult.hasNextPage
      }

      if (acc < amount.int || coinIds.length === 0) {
        toast.error('Not enough balance')
        setIsSending(false)
        return
      }

      // merge all coins into a single object
      if (coinIds.length > 1) {
        txb.mergeCoins(
          txb.object(coinIds[0]),
          coinIds.slice(1).map(c => txb.object(c))
        )
      }
      coin = txb.object(coinIds[0])
      // split the coin to the exact amount if necessary
      if (acc > amount.int) {
        coin = txb.splitCoins(txb.object(coinIds[0]), [txb.pure(amount.int)])
      }
    }

    txb.transferObjects([coin], txb.pure(recipient))

    try {
      const res = await walletKit.signAndExecuteTransactionBlock({
        transactionBlock: txb,
        requestType: 'WaitForLocalExecution',
        chain,
      })
      const url = `https://suiexplorer.com/txblock/${res.digest}?network=${network}`
      toast.success(
        <div>
          Transaction succeeded:{' '}
          <a href={url} target="_blank" rel="noreferrer">
            {res.digest}
          </a>
        </div>
      )

      triggerWalletBalancesUpdate()
      openInfoScreen()
    } catch (e) {
      if (e instanceof UserRejectionError) {
        toast.warn('Transaction rejected')
        return
      }

      toast.error('Transaction failed')
      console.error(e)
      return
    } finally {
      setIsSending(false)
    }
  }, [recipient, amount, selectedCoin, walletKit, client, network, chain, triggerWalletBalancesUpdate, openInfoScreen])

  if (isLoadingWalletBalances) {
    return <Spinner />
  }

  return (
    <div style={{ height: 472, position: 'relative' }}>
      <SendLabel variant="subtitle2" color="primary" fontWeight="medium">
        Send
      </SendLabel>
      <Textarea
        value={recipient}
        textAreaRef={textAreaRef}
        onChange={handleRecipientChange}
        placeholder="Enter Address"
        label="Recipient"
        style={{ marginBottom: 18 }}
        disabled={isSending}
      />
      <TokenSelect
        label="Asset"
        coin={selectedCoin}
        handleCoinChange={handleCoinChange}
        options={options}
        disabled={!infos || infos.size === 0 || isSending}
      />
      <Input
        inputText={sanitizedInputValue}
        onChange={handleAmountChange}
        placeholder="0.00"
        label="Amount"
        style={{ marginBottom: 38 }}
        showMax
        disableMax={!selectedCoin || isSending}
        onMaxClick={handleMaxClick}
        disabled={isSending}
      />
      <SubmitButtonsContainer>
        <Button variant="outlined" onClick={openInfoScreen} style={{ marginRight: 18 }} disabled={isSending}>
          Reject
        </Button>
        <Button onClick={onSendClick} disabled={!sendEnabled || isSending}>
          {isSending ? (
            <Spinner
              style={{
                marginTop: 0,
                marginLeft: 0,
                border: '5px solid #ffffff',
                borderBottomColor: 'transparent',
                width: 32,
                height: 32,
              }}
            />
          ) : (
            'Send'
          )}
        </Button>
      </SubmitButtonsContainer>
      <div style={{ height: 20, backgroundColor: '#ffffff', position: 'absolute', bottom: 0, width: '100%' }} />
    </div>
  )
}

export default Send
