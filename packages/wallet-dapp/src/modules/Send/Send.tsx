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
import { useCurrentAccount, useCurrentClient, useDAppKit } from '@mysten/dapp-kit-react'
import { suiTypeArg } from 'utils/const'
import { Amount } from 'lib/amount'
import { MIN_GAS_RESERVE, estimateGasReserve, isInsufficientGasError, placeholderAmount } from 'utils/gasReserve'

interface Props {
  openInfoScreen: () => void
  initialCoinInfo: CoinInfo | undefined
}

function isValidSuiAddress(value: string): boolean {
  return /^0x[a-fA-F0-9]+$/.test(value) && value.length - 2 === 64
}

function buildSendTx(coinType: string, amount: bigint, recipient: string): Transaction {
  const txb = new Transaction()
  txb.moveCall({
    target: '0x2::balance::send_funds',
    typeArguments: [coinType],
    arguments: [txb.balance({ type: coinType, balance: amount }), txb.pure.address(recipient)],
  })
  return txb
}

const Send = ({ openInfoScreen, initialCoinInfo }: Props) => {
  const [recipient, setRecipient] = useState('')
  const [rawInputStr, setRawInputStr] = useState('')
  const [selectedCoin, setSelectedCoin] = useState<CoinInfo | undefined>(initialCoinInfo)
  const [isSending, setIsSending] = useState(false)
  const [isEstimatingMax, setIsEstimatingMax] = useState(false)

  const textAreaRef = useRef<HTMLTextAreaElement>(null)

  const currentAccount = useCurrentAccount()
  const client = useCurrentClient()
  const { network } = useNetwork()
  const dAppKit = useDAppKit()

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

  const handleMaxClick = useCallback(async () => {
    if (!selectedCoin || isEstimatingMax) {
      return
    }
    if (selectedCoin.meta.typeArg !== suiTypeArg) {
      setRawInputStr(selectedCoin.amount.toString())
      return
    }

    // Gas comes out of the same SUI balance we're sending from, so "max" is
    // the balance minus whatever the node will budget for gas.
    const balance = selectedCoin.amount.int
    let reserve = MIN_GAS_RESERVE
    if (currentAccount) {
      setIsEstimatingMax(true)
      try {
        const sender = currentAccount.address
        const estimateTx = buildSendTx(suiTypeArg, placeholderAmount(balance), sender)
        reserve = await estimateGasReserve(client, sender, estimateTx)
      } catch (e) {
        console.error('gas reserve estimate failed, using floor', e)
      } finally {
        setIsEstimatingMax(false)
      }
    }
    const max = balance > reserve ? balance - reserve : 0n
    setRawInputStr(Amount.fromInt(max, selectedCoin.meta.decimals).toString())
  }, [selectedCoin, isEstimatingMax, currentAccount, client])

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

  // For SUI the sendable amount is capped by the gas floor; the real budget
  // is only known after an estimate (see handleMaxClick), so this is a cheap
  // sync guard against the obvious "send everything" case.
  let spendable = selectedCoin?.amount.int ?? 0n
  if (selectedCoin?.meta.typeArg === suiTypeArg) {
    spendable = spendable > MIN_GAS_RESERVE ? spendable - MIN_GAS_RESERVE : 0n
  }

  let sendEnabled = false
  if (
    recipient &&
    isValidSuiAddress(recipient) &&
    amount &&
    selectedCoin &&
    amount.int > 0n &&
    amount.int <= spendable &&
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
  } else if (amount && selectedCoin && amount.int > spendable) {
    amountError = 'Not enough SUI left for gas'
  }

  const onSendClick = useCallback(async () => {
    setIsSending(true)
    if (!recipient || !amount || !selectedCoin || !currentAccount) {
      toast.error('Something went wrong')
      setIsSending(false)
      return
    }

    const txb = buildSendTx(selectedCoin.meta.typeArg, amount.int, recipient)

    try {
      const res = await dAppKit.signAndExecuteTransaction({ transaction: txb })
      if (res.$kind === 'FailedTransaction') {
        toast.error(`Transaction failed: ${res.FailedTransaction.status.error || 'unknown error'}`)
        return
      }
      const digest = res.Transaction.digest
      const url = `https://${network}.suivision.xyz/txblock/${digest}`
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
      } else if (isInsufficientGasError(e)) {
        // Node-side gas selection (via the snap's dry run) rejects the tx
        // when the SUI balance can't cover both the transfer and gas.
        toast.error('Not enough SUI to cover gas')
      } else {
        toast.error('Transaction failed')
        console.error(e)
      }
    } finally {
      setIsSending(false)
    }
  }, [recipient, amount, selectedCoin, currentAccount, dAppKit, network, triggerWalletBalancesUpdate, openInfoScreen])

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
                  {isEstimatingMax
                    ? 'Estimating gas…'
                    : `Balance: ${selectedCoin.amount.toNumber().toLocaleString('en-US', { maximumFractionDigits: 20 })} ${
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
