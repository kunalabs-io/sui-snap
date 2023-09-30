import { useQuery } from '@tanstack/react-query'
import { useWalletKit } from '@mysten/wallet-kit'
import { SuiTransactionBlockResponse } from '@mysten/sui.js/client'

import { useSuiClientProvider } from './useSuiClientProvider'
import { useNetwork } from './useNetworkProvider'
import useCoinMetadatas from './useCoinMetadatas'
import {
  BalanceChange,
  genTxBlockTransactionsTextForEachTx,
  getBalanceChangesForEachTx,
  getChangesForEachTx,
  getCoinTypes,
  getTxTimestampStart,
} from './transaction'

interface TransactionsInfos {
  isLoading: boolean
  transactions: SuiTransactionBlockResponse[]
  balanceChanges: Map<string, BalanceChange[]>
  txBlockTexts: Map<string, string[]>
}

export const useTransactions = (options?: { refetchInterval?: number }): TransactionsInfos => {
  const { currentAccount } = useWalletKit()
  const suiClient = useSuiClientProvider()
  const { network } = useNetwork()

  const result = useQuery({
    queryKey: ['useTransactions', currentAccount?.address || '', network],
    enabled: !!currentAccount?.address,
    refetchInterval: options?.refetchInterval,
    queryFn: async () => {
      if (!currentAccount) {
        throw new Error('Invariant violation')
      }

      const fromTransactions = suiClient.queryTransactionBlocks({
        filter: {
          FromAddress: currentAccount?.address || '',
        },
        options: {
          showBalanceChanges: true,
          showEffects: true,
          showInput: true,
        },
        order: 'descending',
      })
      const toTransactions = suiClient.queryTransactionBlocks({
        filter: {
          ToAddress: currentAccount?.address || '',
        },
        options: {
          showBalanceChanges: true,
          showEffects: true,
          showInput: true,
        },
        order: 'descending',
      })

      const [fromRes, toRes] = await Promise.all([fromTransactions, toTransactions])
      return {
        sent: fromRes,
        received: toRes,
      }
    },
  })

  const sentTransactions = result.data?.sent.data || []
  const receivedTransactions = result.data?.received.data || []

  let transactions: SuiTransactionBlockResponse[] = []
  {
    const map = new Map<string, SuiTransactionBlockResponse>()
    for (const tx of sentTransactions) {
      map.set(tx.digest, tx)
    }
    for (const tx of receivedTransactions) {
      map.set(tx.digest, tx)
    }
    transactions = Array.from(map.values())
  }

  let coinTypeChanges = new Map<string, Map<string, bigint>>()
  let txBlockTexts = new Map<string, string[]>()
  let txTimestampStart = 0
  if (transactions && currentAccount) {
    coinTypeChanges = getChangesForEachTx(transactions, currentAccount.address)
    txBlockTexts = genTxBlockTransactionsTextForEachTx(transactions)

    if (result.data?.sent.hasNextPage || result.data?.received.hasNextPage) {
      txTimestampStart = getTxTimestampStart(sentTransactions, receivedTransactions)
    }
  }

  const metas = useCoinMetadatas(coinTypeChanges ? getCoinTypes(coinTypeChanges) : [])

  let balanceChanges = new Map<string, BalanceChange[]>()
  if (!metas.isLoading && metas && coinTypeChanges && sentTransactions && receivedTransactions) {
    balanceChanges = getBalanceChangesForEachTx(coinTypeChanges, metas.metas, transactions)
  }

  const transactionsToShow = transactions.filter(tx => {
    if (!tx.timestampMs) {
      return true
    }
    return Number.parseInt(tx.timestampMs) >= txTimestampStart
  })
  transactionsToShow.sort((a, b) => {
    if (!a.timestampMs || !b.timestampMs) {
      return 0
    }
    return Number.parseInt(b.timestampMs) - Number.parseInt(a.timestampMs)
  })

  return {
    balanceChanges,
    txBlockTexts,
    isLoading: result.isLoading || metas.isLoading,
    transactions: transactionsToShow,
  }
}
