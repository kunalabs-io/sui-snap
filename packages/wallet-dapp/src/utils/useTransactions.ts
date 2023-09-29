import { useEffect, useMemo, useState } from 'react'
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
  balanceChanges: Map<string, BalanceChange[]> | null
  txBlockTexts: Map<string, string[]> | null
}

export const useTransactions = (options?: { refetchInterval?: number }): TransactionsInfos => {
  const [sentTransactions, setSentTransactions] = useState<SuiTransactionBlockResponse[] | null>(null)
  const [receivedTransactions, setReceivedTransactions] = useState<SuiTransactionBlockResponse[] | null>(null)
  const [txTimestampStart, setTxTimestampStart] = useState<number | null>(null)

  const { currentAccount } = useWalletKit()
  const suiClient = useSuiClientProvider()
  const { network } = useNetwork()

  useEffect(() => {
    setReceivedTransactions(null)
    setSentTransactions(null)
  }, [network, currentAccount?.address])

  const coinTypeChanges = useMemo(() => {
    return getChangesForEachTx(sentTransactions, receivedTransactions, currentAccount?.address)
  }, [sentTransactions, receivedTransactions, currentAccount?.address])

  const txBlockTexts = useMemo(() => {
    return genTxBlockTransactionsTextForEachTx(sentTransactions, receivedTransactions)
  }, [sentTransactions, receivedTransactions])

  const metas = useCoinMetadatas(coinTypeChanges ? getCoinTypes(coinTypeChanges) : [])

  const balanceChanges = useMemo(() => {
    if (metas.isLoading || !metas || !coinTypeChanges || !sentTransactions || !receivedTransactions) {
      return null
    }

    return getBalanceChangesForEachTx(coinTypeChanges, metas.metas, [
      ...(sentTransactions || []),
      ...(receivedTransactions || []),
    ])
  }, [metas, coinTypeChanges, sentTransactions, receivedTransactions])

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

    if (type === 'from') {
      setSentTransactions(fetchedTransactions.data as SuiTransactionBlockResponse[])
    } else {
      setReceivedTransactions(fetchedTransactions.data as SuiTransactionBlockResponse[])
    }
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

  useEffect(() => {
    if (!results[0].data?.hasNextPage && !results[1].data?.hasNextPage) {
      return
    }
    setTxTimestampStart(getTxTimestampStart(sentTransactions, receivedTransactions))
  }, [sentTransactions, receivedTransactions, results])

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
