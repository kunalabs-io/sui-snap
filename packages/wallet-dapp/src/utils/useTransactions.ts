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

  const sentTransactions = result.data?.sent.data
  const receivedTransactions = result.data?.received.data

  let coinTypeChanges: ReturnType<typeof getChangesForEachTx> | undefined = undefined
  let txBlockTexts: ReturnType<typeof genTxBlockTransactionsTextForEachTx> | undefined = undefined
  let txTimestampStart: number | undefined = undefined
  if (sentTransactions && receivedTransactions && currentAccount) {
    coinTypeChanges = getChangesForEachTx(sentTransactions, receivedTransactions, currentAccount.address)
    txBlockTexts = genTxBlockTransactionsTextForEachTx(sentTransactions, receivedTransactions)

    if (result.data?.sent.hasNextPage || result.data?.received.hasNextPage) {
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

  const allTxs = [sentTransactions || [], receivedTransactions || []].flat()

  return {
    balanceChanges,
    txBlockTexts,
    isLoading: result.isLoading || metas.isLoading,
    transactions: getDisplayTransactions(allTxs, txTimestampStart),
  }
}
