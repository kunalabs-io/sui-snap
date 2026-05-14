import { useQuery } from '@tanstack/react-query'
import { graphql } from '@mysten/sui/graphql/schema'
import { bcs } from '@mysten/sui/bcs'
import { fromBase64, toHex } from '@mysten/sui/utils'

import { useNetwork } from './useNetworkProvider'
import useCoinMetadatas from './useCoinMetadatas'
import { useCurrentAccount, useCurrentClient } from '@mysten/dapp-kit-react'
import { BalanceChange, formatBalanceChanges } from './transaction'

const TRANSACTIONS_QUERY = graphql(`
  query getActivityTransactions($address: SuiAddress!, $first: Int!, $after: String) {
    transactions(filter: { affectedAddress: $address }, first: $first, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        digest
        transactionBcs
        sender {
          address
        }
        effects {
          timestamp
          status
          gasEffects {
            gasSummary {
              computationCost
              storageCost
              storageRebate
              nonRefundableStorageFee
            }
          }
          balanceChanges(first: 50) {
            nodes {
              coinType {
                repr
              }
              amount
            }
          }
        }
      }
    }
  }
`)

/**
 * Decode the base64 BCS of a transaction and return each Programmable
 * Transaction command as a short display string.
 *
 * The format is tuned for the Activity row's one-line rendering and the
 * TransactionDetails block list:
 *  - MoveCall    →  `pkg::mod::fn`, with `<T1, T2, …>` appended when the
 *                   call has type arguments. TransactionDetails splits on
 *                   the first two `::` so `pkg` stays clickable.
 *  - TransferObjects / SplitCoins / MergeCoins / Publish →
 *                   `Kind(N <thing>)` where N is the vector length —
 *                   gives the user a sense of scale without needing to
 *                   resolve PTB inputs.
 *  - Upgrade     →  `Upgrade(<ellipsized-pkg>)` since the package id is
 *                   inline (the upgrade ticket is a PTB input we can't
 *                   resolve without more queries).
 *  - MakeMoveVec →  `MakeMoveVec<T>` when an explicit element type is
 *                   set, else `MakeMoveVec`.
 *
 * Returns an empty array if the BCS is missing or fails to decode — we
 * never want a malformed blob to blow up the Activity list.
 */
function decodeCommandSummaries(transactionBcs: string | null | undefined): string[] {
  if (!transactionBcs) return []
  try {
    const data = bcs.TransactionData.fromBase64(transactionBcs)
    const ptx = data.V1?.kind?.ProgrammableTransaction
    if (!ptx) return []
    return ptx.commands.map(cmd => {
      if (cmd.MoveCall) {
        const m = cmd.MoveCall
        return `${normalizeAddresses(m.package)}::${m.module}::${m.function}`
      }
      if (cmd.TransferObjects) {
        const { objects, address } = cmd.TransferObjects
        const dest = resolveAddressArgument(address, ptx.inputs)
        const count = `${objects.length} object${objects.length === 1 ? '' : 's'}`
        return dest
          ? `TransferObjects(${count} → ${normalizeAddresses(dest)})`
          : `TransferObjects(${count})`
      }
      if (cmd.SplitCoins) return `SplitCoins(${cmd.SplitCoins.amounts.length})`
      if (cmd.MergeCoins) return `MergeCoins(${cmd.MergeCoins.sources.length})`
      if (cmd.Publish) {
        return `Publish(${cmd.Publish.modules.length} module${
          cmd.Publish.modules.length === 1 ? '' : 's'
        })`
      }
      if (cmd.Upgrade) return `Upgrade(${ellipsize(cmd.Upgrade.package)})`
      if (cmd.MakeMoveVec) {
        // The schema's `output` transform collapses Option<TypeTag> to
        // `string | null` — non-null means a concrete element type was set.
        const t = cmd.MakeMoveVec.type
        return t ? `MakeMoveVec<${t}>` : 'MakeMoveVec'
      }
      return 'Command'
    })
  } catch {
    return []
  }
}

function ellipsize(addr: string): string {
  if (addr.length <= 10) return addr
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

/**
 * Strip leading-zero padding from every `0x<hex>` substring so framework
 * addresses render as `0x2` / `0x3` instead of the 32-byte zero-padded
 * canonical form. Suivision and other explorers accept the short form.
 */
function normalizeAddresses(s: string): string {
  return s.replace(/0x([0-9a-fA-F]+)/g, (_, hex) => `0x${hex.replace(/^0+/, '') || '0'}`)
}

type ArgumentValue = { Input?: number; GasCoin?: unknown; Result?: number; NestedResult?: [number, number] }
type CallArgValue = { Pure?: { bytes: string }; Object?: unknown; FundsWithdrawal?: unknown }

/**
 * If `arg` references a `CallArg::Pure` input that carries a 32-byte
 * payload, return it formatted as a `0x…` address. Anything else (a
 * result reference, a non-32-byte pure, an object arg, …) → null.
 *
 * We only need to surface the destination of TransferObjects right now;
 * a result-of-MakeMoveVec-then-transfer would still come back null,
 * which is the correct behavior — we don't have the value at that point.
 */
function resolveAddressArgument(
  arg: ArgumentValue,
  inputs: CallArgValue[]
): string | null {
  if (typeof arg.Input !== 'number') return null
  const input = inputs[arg.Input]
  if (!input?.Pure) return null
  try {
    const bytes = fromBase64(input.Pure.bytes)
    if (bytes.length !== 32) return null
    return `0x${toHex(bytes)}`
  } catch {
    return null
  }
}

export interface TransactionGasSummary {
  computationCost: string
  storageCost: string
  storageRebate: string
  nonRefundableStorageFee: string
}

// Native GraphQL-shape transaction view that the Activity screen consumes.
// Fields map 1:1 to the query above; the legacy `SuiTransactionBlockResponse`
// is no longer involved.
export interface ActivityTransaction {
  digest: string
  sender: string | null
  /** ISO date string (DateTime) from the finalizing checkpoint. */
  timestamp: string | null
  status: 'SUCCESS' | 'FAILURE' | null
  gas: TransactionGasSummary | null
  /** Raw per-coinType balance deltas; addresses are not surfaced — we only
   *  show the current account's deltas in the UI. */
  balanceChanges: Array<{ coinType: string; amount: string }>
  /** One entry per PTB command, in execution order. MoveCall commands
   *  are formatted as `package::module::function`; other command kinds
   *  appear as their kind name (e.g. `SplitCoins`). */
  commandSummaries: string[]
}

interface TransactionsInfos {
  isLoading: boolean
  transactions: ActivityTransaction[]
  /** Balance changes formatted with coin metadata, keyed by tx digest. */
  formattedBalanceChanges: Map<string, BalanceChange[]>
}

const ACTIVITY_PAGE_LIMIT = 50

export const useTransactions = (options?: {
  refetchInterval?: number
}): TransactionsInfos => {
  const currentAccount = useCurrentAccount()
  const suiClient = useCurrentClient()
  const { network } = useNetwork()

  const result = useQuery({
    queryKey: ['useTransactions', currentAccount?.address || '', network],
    enabled: !!currentAccount?.address,
    refetchInterval: options?.refetchInterval,
    queryFn: async (): Promise<ActivityTransaction[]> => {
      if (!currentAccount?.address) {
        throw new Error('Invariant violation')
      }

      const res = await suiClient.query({
        query: TRANSACTIONS_QUERY,
        variables: {
          address: currentAccount.address,
          first: ACTIVITY_PAGE_LIMIT,
        },
      })
      if (res.errors?.length) {
        throw new Error(res.errors[0].message)
      }
      const nodes = res.data?.transactions?.nodes ?? []
      return nodes.map(
        (n): ActivityTransaction => ({
          digest: n.digest,
          sender: n.sender?.address ?? null,
          timestamp: n.effects?.timestamp ?? null,
          status: (n.effects?.status as 'SUCCESS' | 'FAILURE' | null | undefined) ?? null,
          gas: n.effects?.gasEffects?.gasSummary
            ? {
                computationCost: String(n.effects.gasEffects.gasSummary.computationCost ?? '0'),
                storageCost: String(n.effects.gasEffects.gasSummary.storageCost ?? '0'),
                storageRebate: String(n.effects.gasEffects.gasSummary.storageRebate ?? '0'),
                nonRefundableStorageFee: String(
                  n.effects.gasEffects.gasSummary.nonRefundableStorageFee ?? '0'
                ),
              }
            : null,
          balanceChanges:
            n.effects?.balanceChanges?.nodes?.map(b => ({
              coinType: b.coinType?.repr ?? '',
              amount: String(b.amount ?? '0'),
            })) ?? [],
          commandSummaries: decodeCommandSummaries(n.transactionBcs),
        })
      )
    },
  })

  const transactions = result.data ?? []

  // Sort newest first by timestamp (GraphQL returns most-recent first for
  // transactions(); preserve that ordering when timestamps are null too).
  const sorted = [...transactions].sort((a, b) => {
    if (!a.timestamp || !b.timestamp) return 0
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  })

  // Build the set of coin types referenced so we can fetch metadata once.
  const coinTypeSet = new Set<string>()
  for (const tx of sorted) {
    for (const change of tx.balanceChanges) {
      coinTypeSet.add(change.coinType)
    }
  }
  const metas = useCoinMetadatas([...coinTypeSet])

  const formattedBalanceChanges = new Map<string, BalanceChange[]>()
  if (!metas.isLoading) {
    for (const tx of sorted) {
      formattedBalanceChanges.set(
        tx.digest,
        formatBalanceChanges(
          tx.balanceChanges.filter(c => c.amount !== '0'),
          metas.metas,
          tx.gas
        )
      )
    }
  }

  return {
    isLoading: result.isLoading || metas.isLoading,
    transactions: sorted,
    formattedBalanceChanges,
  }
}
