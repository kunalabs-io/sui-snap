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
import { Transaction } from '@mysten/sui/transactions'
import { useNetwork } from 'utils/useNetworkProvider'
import { UserRejectionError } from '@kunalabs-io/sui-snap-wallet'
import Textarea from 'components/Textarea/Textarea'
import { useAutoSizeTextarea } from 'utils/useAutoSizeTextarea'
import Typography from 'components/Typography'
import { useCurrentAccount, useDAppKit } from '@mysten/dapp-kit-react'

interface Props {
  openInfoScreen: () => void
  initialCoinInfo: CoinInfo | undefined
}

function isValidSuiAddress(value: string): boolean {
  return /^0x[a-fA-F0-9]+$/.test(value) && value.length - 2 === 64
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

  let recipientError = undefined
  if (recipient && !isValidSuiAddress(recipient)) {
    recipientError = 'Invalid recipient address'
  }
  let amountError = undefined
  if (amount && amount.int <= 0n) {
    amountError = 'Amount must be greater than 0'
  }
  if (amount && selectedCoin && amount.int > selectedCoin.amount.int) {
    amountError = 'Amount too large'
  }

  const currentAccount = useCurrentAccount()
  const { network } = useNetwork()
  const dAppKit = useDAppKit()

  const onSendClick = useCallback(async () => {
    setIsSending(true)
    if (!recipient || !amount || !selectedCoin || !currentAccount) {
      toast.error('Something went wrong')
      setIsSending(false)
      return
    }

    const txb = new Transaction()
    txb.moveCall({
      target: '0x2::balance::send_funds',
      typeArguments: [selectedCoin.meta.typeArg],
      arguments: [
        txb.balance({ type: selectedCoin.meta.typeArg, balance: amount.int }),
        txb.pure.address(recipient),
      ],
    })

    try {
      const res = await dAppKit.signAndExecuteTransaction({ transaction: txb })
      if (res.$kind === 'FailedTransaction') {
        toast.error(`Transaction failed: ${res.FailedTransaction.status.error || 'unknown error'}`)
        return
      }
      const digest = res.Transaction.digest
      const url = `https://suivision.xyz/txblock/${digest}?network=${network}`
      toast.success(
        <div>
          Transaction succeeded:{' '}
          <a href={url} target="_blank" rel="noreferrer">
            {digest}
          </a>
        </div>
      )

      triggerWalletBalancesUpdate()
      openInfoScreen()
    } catch (e) {
      if (e instanceof UserRejectionError) {
        toast.warn('Transaction rejected')
      } else if (e instanceof Error && /No valid gas coins/i.test(e.message)) {
        // SDK's core resolver throws this when the address-balance can't
        // cover both the transfer and gas AND the sender has no Coin<SUI>
        // objects to fall back to as payment.
        toast.error('Not enough SUI to cover gas')
      } else {
        toast.error('Transaction failed')
        console.error(e)
      }
    } finally {
      setIsSending(false)
    }
  }, [
    recipient,
    amount,
    selectedCoin,
    currentAccount,
    dAppKit,
    network,
    triggerWalletBalancesUpdate,
    openInfoScreen,
  ])

  if (isLoadingWalletBalances) {
    return <Spinner />
  }

  return (
    <div style={{ height: '468px', position: 'relative' }}>
      <SendLabel variant="subtitle2" color="primary" fontWeight="medium" style={{ marginTop: 25 }}>
        Send
      </SendLabel>
      <Textarea
        value={recipient}
        textAreaRef={textAreaRef}
        onChange={handleRecipientChange}
        placeholder="Enter Address"
        label="Recipient"
        style={{ marginBottom: 18, padding: '0 14px' }}
        disabled={isSending}
        errorMessage={!sendEnabled ? recipientError : undefined}
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
        label={
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>Amount</div>
            {selectedCoin ? (
              <div onClick={handleMaxClick}>
                <Typography variant="body" color="secondary" style={{ cursor: 'pointer' }}>
                  {`Balance: ${selectedCoin.amount.toNumber().toLocaleString('en-US', { maximumFractionDigits: 20 })} ${
                    selectedCoin.meta.symbol
                  }`}
                </Typography>
              </div>
            ) : null}
          </div>
        }
        style={{ marginBottom: 20, padding: '0 14px' }}
        disabled={isSending}
        errorMessage={!sendEnabled ? amountError : undefined}
      />
      <SubmitButtonsContainer style={{ padding: '0 14px' }}>
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
