import { MoveCallSuiTransaction, SuiArgument, SuiTransactionBlockResponse } from '@mysten/sui.js/client'
import { parseStructTag } from '@mysten/sui.js/utils'

import { CoinMetadata } from 'lib/framework/coin'

export interface BalanceChange {
  symbol: string
  amount: string
}

export const getTokenSymbolAndNameFromTypeArg = (typeArg: string) => {
  const tag = parseStructTag(typeArg)

  const params = []
  for (const param of tag.typeParams) {
    if (typeof param === 'string') {
      params.push(param)
    } else {
      params.push(param.name)
    }
  }

  let name = tag.name
  if (params.length > 0) {
    name += `<${params.join(', ')}>`
  }

  return {
    name: name,
    symbol: tag.name,
  }
}

export function calcTotalGasFeesDec(tx?: SuiTransactionBlockResponse): number {
  const gasUsed = tx?.effects?.gasUsed
  if (!gasUsed) {
    return 0
  }
  const totalGasFeesInt = BigInt(gasUsed.computationCost) + BigInt(gasUsed.storageCost) - BigInt(gasUsed.storageRebate)

  return Number(totalGasFeesInt.toString()) / 1e9
}

export const getChangesForEachTx = (
  sentTransactions: SuiTransactionBlockResponse[] | null,
  receivedTransactions: SuiTransactionBlockResponse[] | null,
  address?: string
): Map<string, Map<string, bigint>> | null => {
  if (sentTransactions !== null && receivedTransactions !== null) {
    const allTransactions = [...sentTransactions, ...receivedTransactions] as SuiTransactionBlockResponse[]

    const changes: Map<string, Map<string, bigint>> = new Map()

    for (const tx of allTransactions) {
      const txChanges: Map<string, bigint> = new Map()
      if (tx.balanceChanges) {
        const { balanceChanges, digest } = tx
        for (const change of balanceChanges) {
          if (
            change.owner === 'Immutable' ||
            !('AddressOwner' in change.owner) ||
            change.owner.AddressOwner !== address
          ) {
            continue
          }
          const value = txChanges.get(change.coinType) ?? 0n
          txChanges.set(change.coinType, value + BigInt(change.amount))
        }
        changes.set(digest, txChanges)
      }
    }

    return changes
  }

  return null
}

export const getCoinTypes = (changes: Map<string, Map<string, bigint>>) => {
  const coinTypes = new Set<string>()
  for (const [_txDigest, _txChanges] of changes) {
    for (const [coinType, _amount] of _txChanges) {
      coinTypes.add(coinType)
    }
  }

  return Array.from(coinTypes)
}

export const getBalanceChangesForEachTx = (
  coinTypeChanges: Map<string, Map<string, bigint>>,
  metas: (CoinMetadata | undefined)[],
  transactions: SuiTransactionBlockResponse[]
) => {
  const balanceChangesMap: Map<string, BalanceChange[]> = new Map()

  for (const [txDigest, txChanges] of coinTypeChanges) {
    const balanceChangesByTransaction: BalanceChange[] = []
    for (const [coinType, amount] of txChanges) {
      const metadata = metas.find(m => m?.typeArg === coinType)
      if (!metadata) {
        balanceChangesByTransaction.push({
          symbol: getTokenSymbolAndNameFromTypeArg(coinType).name,
          amount: amount.toString(),
        })
      } else {
        const positive = amount >= 0n
        const abs = positive ? amount : -amount
        const integral = abs / 10n ** BigInt(metadata.decimals)
        const fractional = abs % 10n ** BigInt(metadata.decimals)

        let value = positive ? '+' : '-'
        value += integral.toString()
        if (fractional > 0n) {
          value += '.'
          value += fractional.toString().padStart(metadata.decimals, '0').replace(/0+$/, '')
        }

        const tx = transactions.find(t => t.digest === txDigest)
        const txFee = calcTotalGasFeesDec(tx)
        if (txFee - Math.abs(Number(value)) !== 0) {
          balanceChangesByTransaction.push({
            symbol: metadata.symbol,
            amount: value,
          })
        }
      }
    }
    balanceChangesMap.set(txDigest, balanceChangesByTransaction)
  }
  return balanceChangesMap
}

export function genTxBlockTransactionsTextForEachTx(
  sentTransactions: SuiTransactionBlockResponse[] | null,
  receivedTransactions: SuiTransactionBlockResponse[] | null
): Map<string, string[]> | null {
  if (!sentTransactions || !receivedTransactions) {
    return null
  }

  const allTransactions = [...sentTransactions, receivedTransactions] as SuiTransactionBlockResponse[]
  const allTxStrings: Map<string, string[]> = new Map()
  for (const tx of allTransactions) {
    const transaction = tx.transaction?.data.transaction
    if (transaction?.kind === 'ProgrammableTransaction') {
      const txStrings = []
      const { transactions } = transaction
      for (const tx of transactions) {
        const txKey = Object.keys(tx)[0]
        switch (txKey) {
          case 'MoveCall': {
            const txMoveCall = tx as {
              MoveCall: MoveCallSuiTransaction
            }
            txStrings.push(`**Call** ${txMoveCall.MoveCall.function}`)
            continue
          }
          case 'MergeCoins': {
            const txMergeCoins = tx as {
              MergeCoins: [SuiArgument, SuiArgument[]]
            }
            txStrings.push(`**Merge** (${txMergeCoins.MergeCoins.length + 1}) coin objects`)
            continue
          }
          case 'SplitCoins': {
            const txSPlitCoins = tx as {
              SplitCoins: [SuiArgument, SuiArgument[]]
            }
            txStrings.push(`**Split** a coin into (${txSPlitCoins.SplitCoins.length}) objects`)
            continue
          }
          case 'TransferObjects': {
            const txTransferObjects = tx as {
              TransferObjects: [SuiArgument[], SuiArgument]
            }

            const str = `**Transfer** (${txTransferObjects.TransferObjects.length}) objects`

            txStrings.push(str)
          }
        }
      }
      allTxStrings.set(tx.digest, txStrings)
    }
  }
  return allTxStrings
}
