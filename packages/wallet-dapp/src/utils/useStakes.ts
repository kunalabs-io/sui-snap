import { QueryClient, useQuery } from '@tanstack/react-query'
import { bcs } from '@mysten/sui/bcs'
import { useNetwork } from './useNetworkProvider'
import { useCurrentAccount, useCurrentClient } from '@mysten/dapp-kit-react'
import type { ValidatorSummary } from './useLatestSuiSystemState'

// Minimal stake info the UI consumes, plus the `pool_id` we use to map
// back to the validator's address (since the JSON-RPC field `validatorAddress`
// is no longer available).
export interface StakeFromGraphQL {
  stakedSuiId: string
  poolId: string
  status: 'Pending' | 'Active'
  stakeActiveEpoch: string
  stakeRequestEpoch: string
  principal: string
}

const STAKED_SUI_TYPE = '0x3::staking_pool::StakedSui'

// Dynamic-field value type stored at each epoch entry of the validator's
// `exchange_rates: Table<u64, PoolTokenExchangeRate>` table.
const PoolTokenExchangeRate = bcs.struct('PoolTokenExchangeRate', {
  sui_amount: bcs.u64(),
  pool_token_amount: bcs.u64(),
})

/**
 * Coerce a Move address/UID/ID json shape — accepts a bare hex string,
 * `{ id: "0x..." }`, or `{ id: { id: "0x..." } }`.
 */
function asAddress(v: unknown): string {
  if (typeof v === 'string') return v
  if (v && typeof v === 'object') {
    const obj = v as Record<string, unknown>
    if (typeof obj.bytes === 'string') return obj.bytes
    if (typeof obj.id === 'string') return obj.id
    if (obj.id && typeof obj.id === 'object') {
      const inner = obj.id as Record<string, unknown>
      if (typeof inner.id === 'string') return inner.id
      if (typeof inner.bytes === 'string') return inner.bytes
    }
  }
  return ''
}

/**
 * Coerce a `Balance<T>` json shape — typically `{ value: "123" }` (or
 * sometimes the bare number string).
 */
function asBalance(v: unknown): string {
  if (typeof v === 'string') return v
  if (v && typeof v === 'object') {
    const obj = v as Record<string, unknown>
    if (typeof obj.value === 'string') return obj.value
    if (typeof obj.value === 'number') return String(obj.value)
  }
  return '0'
}

export const useStakes = () => {
  const client = useCurrentClient()
  const currentAccount = useCurrentAccount()
  const { network } = useNetwork()

  const result = useQuery({
    queryKey: ['stakes', currentAccount?.address, network],
    enabled: !!currentAccount?.address,
    queryFn: async (): Promise<StakeFromGraphQL[]> => {
      const address = currentAccount!.address

      // Get the current epoch alongside the stakes so we can derive
      // Pending vs Active status (the legacy `suix_getStakes` endpoint
      // returned this for free).
      const [sysRes, stakedRes] = await Promise.all([
        client.core.getCurrentSystemState(),
        client.core.listOwnedObjects({
          owner: address,
          type: STAKED_SUI_TYPE,
          include: { json: true },
        }),
      ])
      const currentEpoch = BigInt(sysRes.systemState.epoch)

      const stakes: StakeFromGraphQL[] = []
      for (const obj of stakedRes.objects) {
        const json = (obj.json ?? {}) as Record<string, unknown>
        const poolId = asAddress(json.pool_id)
        const stakeActiveEpoch = String(json.stake_activation_epoch ?? '0')
        const principal = asBalance(json.principal)
        const status = BigInt(stakeActiveEpoch) <= currentEpoch ? 'Active' : 'Pending'
        // `stake_request_epoch` is gone in current `StakedSui`; reuse
        // activation epoch as a best-effort substitute (it bounds the
        // "rewards start" countdown the UI computes).
        const stakeRequestEpoch = stakeActiveEpoch
        stakes.push({
          stakedSuiId: obj.objectId,
          poolId,
          status,
          stakeActiveEpoch,
          stakeRequestEpoch,
          principal,
        })
      }
      return stakes
    },
    refetchInterval: 1000 * 10, // 10 seconds
  })

  return result
}

/**
 * Apply the on-chain `staking_pool::calculate_rewards` formula in JS.
 * Matches the Move source (and the `sui_indexer_alt_jsonrpc` indexer's
 * `estimated_rewards` implementation): the legacy JSON-RPC's
 * `suix_getStakes.estimatedReward` is exactly this number.
 */
function calculateReward(
  principal: bigint,
  activation: { suiAmount: bigint; poolTokenAmount: bigint },
  current: { suiAmount: bigint; poolTokenAmount: bigint }
): bigint {
  const tokens =
    activation.suiAmount === 0n
      ? principal
      : (principal * activation.poolTokenAmount) / activation.suiAmount
  const sui =
    current.poolTokenAmount === 0n
      ? tokens
      : (tokens * current.suiAmount) / current.poolTokenAmount
  return sui > principal ? sui - principal : 0n
}

interface StakeRewardsInput {
  stakes: StakeFromGraphQL[]
  validatorByPoolId: Map<string, ValidatorSummary>
  currentEpoch: bigint | undefined
}

/**
 * Compute the per-stake estimated reward locally. We can't fetch each
 * validator's wrapped `StakingPool` object directly (those addresses
 * return null from `multiGetObjects`), so we route everything through
 * the validator's `exchange_rates: Table<u64, PoolTokenExchangeRate>`
 * id — which IS reachable (it's a regular Sui object that backs the
 * table's dynamic fields, even though the Table struct itself is
 * wrapped). The id comes from the validator JSON in
 * `useLatestSuiSystemState`.
 *
 * For each Active stake that has actually started earning, we read two
 * dynamic fields (activation_epoch + current_epoch), BCS-parse them as
 * `PoolTokenExchangeRate`, and apply the on-chain formula.
 */
export function useStakeRewards({
  stakes,
  validatorByPoolId,
  currentEpoch,
}: StakeRewardsInput) {
  const client = useCurrentClient()
  const { network } = useNetwork()

  const stakeKey = stakes
    .map(s => `${s.stakedSuiId}:${s.stakeActiveEpoch}:${s.principal}`)
    .join(',')

  return useQuery({
    queryKey: [
      'stakeRewards',
      network,
      currentEpoch?.toString() ?? '',
      stakeKey,
    ],
    enabled:
      currentEpoch !== undefined &&
      stakes.length > 0 &&
      validatorByPoolId.size > 0,
    queryFn: async (): Promise<Map<string, bigint>> => {
      if (currentEpoch === undefined) return new Map()
      const out = new Map<string, bigint>()

      const activeStakes = stakes.filter(
        s => s.status === 'Active' && BigInt(s.stakeActiveEpoch) < currentEpoch
      )

      await Promise.all(
        activeStakes.map(async stake => {
          const validator = validatorByPoolId.get(stake.poolId)
          const tableId = validator?.exchangeRatesTableId
          if (!tableId) return
          const activationKey = bcs.u64().serialize(BigInt(stake.stakeActiveEpoch)).toBytes()
          const currentKey = bcs.u64().serialize(currentEpoch).toBytes()
          try {
            const [activationRes, currentRes] = await Promise.all([
              client.core.getDynamicField({
                parentId: tableId,
                name: { type: 'u64', bcs: activationKey },
              }),
              client.core.getDynamicField({
                parentId: tableId,
                name: { type: 'u64', bcs: currentKey },
              }),
            ])
            const activation = PoolTokenExchangeRate.parse(
              activationRes.dynamicField.value.bcs
            )
            const current = PoolTokenExchangeRate.parse(currentRes.dynamicField.value.bcs)
            const reward = calculateReward(
              BigInt(stake.principal),
              {
                suiAmount: BigInt(activation.sui_amount),
                poolTokenAmount: BigInt(activation.pool_token_amount),
              },
              {
                suiAmount: BigInt(current.sui_amount),
                poolTokenAmount: BigInt(current.pool_token_amount),
              }
            )
            out.set(stake.stakedSuiId, reward)
          } catch {
            /* Dynamic field not yet populated (e.g. at the very start
             * of an epoch) — leave this stake out; the UI shows blank. */
          }
        })
      )
      return out
    },
    refetchInterval: 1000 * 60, // 1 minute — rewards only change at epoch boundaries
  })
}

export async function invalidateStakes(client: QueryClient) {
  await client.invalidateQueries({
    predicate: query => {
      return query.queryKey[0] === 'stakes'
    },
  })
}

export default useStakes
