import { useQueries } from '@tanstack/react-query'
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
  getDisplayTransactions,
  getTxTimestampStart,
} from './transaction'

interface TransactionsInfos {
  isLoading: boolean
  transactions?: SuiTransactionBlockResponse[]
  balanceChanges?: Map<string, BalanceChange[]>
  txBlockTexts?: Map<string, string[]>
}

export const useTransactions = (options?: { refetchInterval?: number }): TransactionsInfos => {
  const { currentAccount } = useWalletKit()
  const suiClient = useSuiClientProvider()
  const { network } = useNetwork()

  const fetchTransactions = async (type: 'from' | 'to') => {
    const fetchedTransactions = await suiClient.queryTransactionBlocks({
      filter:
        type === 'from'
          ? {
              FromAddress: currentAccount?.address || '',
            }
          : {
              ToAddress: currentAccount?.address || '',
            },
      options: {
        showBalanceChanges: true,
        showEffects: true,
        showEvents: true,
        showObjectChanges: true,
        showInput: true,
        showRawInput: true,
      },
      order: 'descending',
    })

    return fetchedTransactions
  }

  const results = useQueries({
    queries: [
      {
        queryKey: ['transactions', 'from', currentAccount?.address || '', network],
        enabled: !!currentAccount?.address,
        queryFn: () => fetchTransactions('from'),
        refetchInterval: options?.refetchInterval,
      },
      {
        queryKey: ['transactions', 'to', currentAccount?.address || '', network],
        enabled: !!currentAccount?.address,
        queryFn: () => fetchTransactions('to'),
        refetchInterval: options?.refetchInterval,
      },
    ],
  })

  const sentTransactions = results[0].data?.data
  const receivedTransactions = results[1].data?.data

  let coinTypeChanges: ReturnType<typeof getChangesForEachTx> | undefined = undefined
  let txBlockTexts: ReturnType<typeof genTxBlockTransactionsTextForEachTx> | undefined = undefined
  let txTimestampStart: number | undefined = undefined
  if (sentTransactions && receivedTransactions && currentAccount) {
    coinTypeChanges = getChangesForEachTx(sentTransactions, receivedTransactions, currentAccount.address)
    txBlockTexts = genTxBlockTransactionsTextForEachTx(sentTransactions, receivedTransactions)

    if (results[0].data?.hasNextPage || results[1].data?.hasNextPage) {
      txTimestampStart = getTxTimestampStart(sentTransactions, receivedTransactions)
    }
  }

  const metas = useCoinMetadatas(coinTypeChanges ? getCoinTypes(coinTypeChanges) : [])

  let balanceChanges: Map<string, BalanceChange[]> | undefined = undefined
  if (!metas.isLoading && metas && coinTypeChanges && sentTransactions && receivedTransactions) {
    balanceChanges = getBalanceChangesForEachTx(coinTypeChanges, metas.metas, [
      ...sentTransactions,
      ...receivedTransactions,
    ])
  }

  return {
    balanceChanges,
    txBlockTexts,
    isLoading: results.some(r => r.isLoading) || metas.isLoading,
    transactions: getDisplayTransactions(
      results.map(r => r?.data?.data as SuiTransactionBlockResponse[]).flat(),
      txTimestampStart
    ),
  }
}
