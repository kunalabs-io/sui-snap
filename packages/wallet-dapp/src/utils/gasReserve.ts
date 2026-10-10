import type { ClientWithCoreApi } from '@mysten/sui/client'
import type { Transaction } from '@mysten/sui/transactions'

/**
 * Smallest amount of SUI we always keep back for gas, regardless of what the
 * estimate says (0.01 SUI). Also the fallback when the estimate fails.
 *
 * Sized from mainnet simulations (Oct 2026, reference gas price 100 MIST/unit):
 * node-assigned budget was 0.0002 SUI for `balance::send_funds` and
 * 0.0016 SUI for `request_add_stake` (gRPC and GraphQL agreed exactly).
 * Computation scales with gas price, storage doesn't, so 0.01 SUI still
 * covers both even if the gas price rises ~10x.
 */
export const MIN_GAS_RESERVE = 10_000_000n

/** Headroom over the estimated budget, in case the gas price ticks between estimate and send. */
const GAS_RESERVE_MARGIN_PCT = 20n

/**
 * Estimates the gas budget the node will assign to `tx`, with a safety margin.
 *
 * Gas selection happens node-side: when `tx.build` resolves the transaction,
 * the node simulates it and fills in `gasData.budget`. The node then requires
 * `addressBalance >= withdrawals + budget`, so a "send everything" has to leave
 * at least that budget behind. Gas cost doesn't depend on the amount moved, so
 * callers pass a tx built with any placeholder amount that definitely fits.
 */
export async function estimateGasReserve(
  client: ClientWithCoreApi,
  sender: string,
  tx: Transaction
): Promise<bigint> {
  tx.setSenderIfNotSet(sender)
  await tx.build({ client })
  const budget = tx.getData().gasData.budget
  if (budget == null) {
    throw new Error('gas budget not resolved')
  }
  const withMargin = (BigInt(budget) * (100n + GAS_RESERVE_MARGIN_PCT)) / 100n
  return withMargin > MIN_GAS_RESERVE ? withMargin : MIN_GAS_RESERVE
}

/**
 * Picks a placeholder amount for the estimate tx: half the balance, but at
 * least 1 MIST so the tx is well-formed even for tiny balances.
 */
export function placeholderAmount(balance: bigint): bigint {
  const half = balance / 2n
  return half > 0n ? half : 1n
}

/** Matches the node's gas-selection failure as forwarded by the snap. */
export function isInsufficientGasError(e: unknown): boolean {
  return e instanceof Error && /gas selection|insufficient SUI|No valid gas coins/i.test(e.message)
}
