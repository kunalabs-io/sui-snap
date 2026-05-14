import { parseStructTag } from '@mysten/sui/utils'

import { CoinMetadata } from 'lib/coin'
import type { TransactionGasSummary } from './useTransactions'

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

export function calcTotalGasFeesDec(gas?: TransactionGasSummary | null): number {
  if (!gas) {
    return 0
  }
  const totalGasFeesInt =
    BigInt(gas.computationCost) + BigInt(gas.storageCost) - BigInt(gas.storageRebate)

  return Number(totalGasFeesInt.toString()) / 1e9
}

export function getTxFees(gas?: TransactionGasSummary | null) {
  if (!gas) {
    return null
  }
  const totalGasFeesInt =
    BigInt(gas.computationCost) + BigInt(gas.storageCost) - BigInt(gas.storageRebate)

  return {
    total: Number(totalGasFeesInt.toString()) / 1e9,
    computation: Number(BigInt(gas.computationCost).toString()) / 1e9,
    storage: Number(BigInt(gas.storageCost).toString()) / 1e9,
    rebate: Number(BigInt(gas.storageRebate).toString()) / 1e9,
  }
}

/**
 * Format a transaction's raw per-coinType balance deltas into UI strings,
 * using fetched coin metadata for symbol + decimals. SUI entries whose
 * absolute amount equals the gas fee are filtered out (these are 'just the
 * gas, no actual transfer' rows).
 */
export function formatBalanceChanges(
  changes: Array<{ coinType: string; amount: string }>,
  metas: (CoinMetadata | undefined)[],
  gas: TransactionGasSummary | null
): BalanceChange[] {
  const typeArgToMeta = new Map<string, CoinMetadata>()
  for (const m of metas) {
    if (m) typeArgToMeta.set(m.typeArg, m)
  }

  const out: BalanceChange[] = []
  for (const { coinType, amount: amountStr } of changes) {
    const amount = BigInt(amountStr)
    const meta = typeArgToMeta.get(coinType)
    if (!meta) {
      out.push({
        symbol: getTokenSymbolAndNameFromTypeArg(coinType).name,
        amount: amount.toString(),
      })
      continue
    }

    const positive = amount >= 0n
    const abs = positive ? amount : -amount
    const integral = abs / 10n ** BigInt(meta.decimals)
    const fractional = abs % 10n ** BigInt(meta.decimals)

    let value = positive ? '+' : '-'
    value += integral.toString()
    if (fractional > 0n) {
      value += '.'
      value += fractional.toString().padStart(meta.decimals, '0').replace(/0+$/, '')
    }

    // Skip rows that are exactly the gas fee (no real balance movement).
    const txFee = calcTotalGasFeesDec(gas)
    if (txFee - Math.abs(Number(value)) !== 0) {
      out.push({ symbol: meta.symbol, amount: value })
    }
  }
  return out
}
