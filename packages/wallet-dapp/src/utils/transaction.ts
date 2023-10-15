import { MoveCallSuiTransaction, SuiTransactionBlockResponse } from '@mysten/sui.js/client'
import { parseStructTag } from '@mysten/sui.js/utils'

import { CoinMetadata } from 'lib/coin'

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

export function getTxFees(tx?: SuiTransactionBlockResponse) {
  const gasUsed = tx?.effects?.gasUsed
  if (!gasUsed) {
    return null
  }
  const totalGasFeesInt = BigInt(gasUsed.computationCost) + BigInt(gasUsed.storageCost) - BigInt(gasUsed.storageRebate)

  return {
    total: Number(totalGasFeesInt.toString()) / 1e9,
    computation: Number(BigInt(gasUsed.computationCost).toString()) / 1e9,
    storage: Number(BigInt(gasUsed.storageCost).toString()) / 1e9,
    rebate: Number(BigInt(gasUsed.storageRebate).toString()) / 1e9,
  }
}

export const getChangesForEachTx = (
  transactions: SuiTransactionBlockResponse[],
  address: string
): Map<string, Map<string, bigint>> => {
  const changes: Map<string, Map<string, bigint>> = new Map()

  for (const tx of transactions) {
    const txChanges: Map<string, bigint> = new Map()
    if (!tx.balanceChanges) {
      continue
    }
    const { balanceChanges, digest } = tx
    for (const change of balanceChanges) {
      if (change.owner === 'Immutable' || !('AddressOwner' in change.owner) || change.owner.AddressOwner !== address) {
        continue
      }
      const value = txChanges.get(change.coinType) ?? 0n
      txChanges.set(change.coinType, value + BigInt(change.amount))
    }
    changes.set(digest, txChanges)
  }

  return changes
}

export const getCoinTypes = (changes: Map<string, Map<string, bigint>>): string[] => {
  const coinTypes = new Set<string>()
  for (const txChanges of changes.values()) {
    for (const coinType of txChanges.keys()) {
      coinTypes.add(coinType)
    }
  }

  return Array.from(coinTypes)
}

export const getBalanceChangesForEachTx = (
  coinTypeChanges: Map<string, Map<string, bigint>>,
  metas: (CoinMetadata | undefined)[],
  transactions: SuiTransactionBlockResponse[]
): Map<string, BalanceChange[]> => {
  const balanceChangesMap: Map<string, BalanceChange[]> = new Map()

  const digestToTxMap = transactions.reduce(
    (map, tx) => map.set(tx.digest, tx),
    new Map<string, SuiTransactionBlockResponse>()
  )

  const typeArgToMetaMap = new Map<string, CoinMetadata>()
  for (const m of metas) {
    if (!m) {
      continue
    }
    typeArgToMetaMap.set(m.typeArg, m)
  }

  for (const [txDigest, txChanges] of coinTypeChanges) {
    const balanceChangesByTransaction: BalanceChange[] = []
    for (const [coinType, amount] of txChanges) {
      const metadata = typeArgToMetaMap.get(coinType)
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

        const tx = digestToTxMap.get(txDigest)
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

export function genTxBlockForTxDetails(tx: SuiTransactionBlockResponse): string[] | null {
  const transaction = tx.transaction?.data.transaction
  if (transaction?.kind !== 'ProgrammableTransaction') {
    return null
  }
  const txStrings = []
  const { transactions } = transaction
  for (const tx of transactions) {
    const txKey = Object.keys(tx)[0]
    switch (txKey) {
      case 'MoveCall': {
        const txMoveCall = tx as {
          MoveCall: MoveCallSuiTransaction
        }
        txStrings.push(`${txMoveCall.MoveCall.package}::${txMoveCall.MoveCall.module}::${txMoveCall.MoveCall.function}`)
        continue
      }
      case 'MergeCoins': {
        txStrings.push('MergeCoins')
        continue
      }
      case 'SplitCoins': {
        txStrings.push('SplitCoins')
        continue
      }
      case 'TransferObjects': {
        txStrings.push('TransferObjects')
        continue
      }
      case 'Publish': {
        txStrings.push('Publish')
        continue
      }
      case 'Upgrade': {
        txStrings.push('Upgrade')
        continue
      }
      case 'MakeMoveVec': {
        txStrings.push('MakeMoveVec')
      }
    }
  }
  return txStrings
}

export function genTxBlockTransactionsTextForEachTx(
  transactions: SuiTransactionBlockResponse[]
): Map<string, string[]> {
  const allTxStrings: Map<string, string[]> = new Map()
  for (const tx of transactions) {
    const transaction = tx.transaction?.data.transaction
    if (transaction?.kind !== 'ProgrammableTransaction') {
      continue
    }
    const txStrings = []
    const { transactions } = transaction
    for (const tx of transactions) {
      const txKey = Object.keys(tx)[0]
      switch (txKey) {
        case 'MoveCall': {
          const txMoveCall = tx as {
            MoveCall: MoveCallSuiTransaction
          }
          txStrings.push(txMoveCall.MoveCall.function)
          continue
        }
        case 'MergeCoins': {
          txStrings.push('MergeCoins')
          continue
        }
        case 'SplitCoins': {
          txStrings.push('SplitCoins')
          continue
        }
        case 'TransferObjects': {
          txStrings.push('TransferObjects')
          continue
        }
        case 'Publish': {
          txStrings.push('Publish')
          continue
        }
        case 'Upgrade': {
          txStrings.push('Upgrade')
          continue
        }
        case 'MakeMoveVec': {
          txStrings.push('MakeMoveVec')
        }
      }
    }
    allTxStrings.set(tx.digest, txStrings)
  }
  return allTxStrings
}

export const getTxTimestampStart = (
  sentTransactions: SuiTransactionBlockResponse[],
  receivedTransactions: SuiTransactionBlockResponse[]
): number => {
  if (!sentTransactions || !receivedTransactions) {
    return 0
  }

  const minTimestampSent = sentTransactions.reduce(
    (min, tx) => {
      if (typeof tx.timestampMs === 'undefined' || tx.timestampMs === null) {
        return min
      }

      const timestampNum = parseInt(tx.timestampMs, 10)
      return timestampNum < (min || Infinity) ? timestampNum : min
    },
    parseInt(sentTransactions[0].timestampMs || '', 10)
  )
  const minTimestampReceived = receivedTransactions.reduce(
    (min, tx) => {
      if (typeof tx.timestampMs === 'undefined' || tx.timestampMs === null) {
        return min
      }

      const timestampNum = parseInt(tx.timestampMs, 10)
      return timestampNum < (min || Infinity) ? timestampNum : min
    },
    parseInt(receivedTransactions[0].timestampMs || '', 10)
  )

  return Math.max(minTimestampSent, minTimestampReceived)
}
