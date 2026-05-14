import { useQuery } from '@tanstack/react-query'
import { graphql } from '@mysten/sui/graphql/schema'
import type { SuiGraphQLClient } from '@mysten/sui/graphql'

import { useNetwork } from './useNetworkProvider'
import { useCurrentClient } from '@mysten/dapp-kit-react'

// Per-validator subset of `0x3::validator::Validator` we surface to the UI.
// The on-chain Move struct (rendered as JSON by MoveValue.json) actually
// has many more fields; we type only what we render.
export interface ValidatorSummary {
  suiAddress: string
  name: string
  imageUrl: string
  stakingPoolId: string
  stakingPoolSuiBalance: string
  votingPower: string
  commissionRate: string
  /** UID of the validator's `exchange_rates: Table<u64, PoolTokenExchangeRate>`.
   *  Used as the parent for per-epoch dynamic-field reads when computing
   *  stake rewards — we can't fetch the wrapped StakingPool directly, so
   *  this is the only way to reach its rate history. */
  exchangeRatesTableId: string
  /** Decimal-fraction APY (e.g. 0.05 = 5%) computed from the validator's
   *  exchange-rate change between the previous and current epoch. Undefined
   *  when the sample falls outside the sanity guard (0, 0.1) — pool just
   *  activated, slashed mid-epoch, or rounding artifact on a tiny pool. */
  apy?: number
}

export interface SystemStateSummary {
  epoch: string
  epochStartTimestampMs: string
  epochDurationMs: string
  activeValidators: ValidatorSummary[]
}

function asAddress(v: unknown): string {
  if (typeof v === 'string') return v
  if (v && typeof v === 'object') {
    const obj = v as Record<string, unknown>
    if (typeof obj.bytes === 'string') return obj.bytes
    if (obj.id && typeof obj.id === 'object') {
      const inner = obj.id as Record<string, unknown>
      if (typeof inner.id === 'string') return inner.id
      if (typeof inner.bytes === 'string') return inner.bytes
    }
  }
  return ''
}

// Probe: fetch the current epoch up-front so we know which two exchange-rate
// entries to dereference in the validator query below. The format-template
// strings we pass to that query embed the literal epoch numbers, so they
// have to be built after this returns.
const EPOCH_PROBE_QUERY = graphql(`
  query getEpochProbe {
    epoch {
      epochId
      startTimestamp
      systemState {
        json
      }
    }
  }
`)

// Mysten's GraphQL caps connection page size at 50, so we paginate the
// active-validator list (mainnet has ~150). `rateN` / `rateN1` use Display
// v2's `->[Ku64]` table-dereference syntax to pull two specific entries
// out of `staking_pool.exchange_rates` server-side — the alternative is
// per-validator per-epoch `getDynamicField` calls, which would multiply
// request count by 150–200.
const VALIDATORS_WITH_RATES_QUERY = graphql(`
  query getValidatorsWithRates(
    $after: String
    $formatRateN: String!
    $formatRateN1: String!
  ) {
    epoch {
      validatorSet {
        activeValidators(first: 50, after: $after) {
          pageInfo {
            hasNextPage
            endCursor
          }
          nodes {
            contents {
              json
              rateN: format(format: $formatRateN)
              rateN1: format(format: $formatRateN1)
            }
          }
        }
      }
    }
  }
`)

type ValidatorContentsJson = { json?: unknown } | null | undefined
type ValidatorNode = {
  contents?:
    | (ValidatorContentsJson & { rateN?: unknown; rateN1?: unknown })
    | null
} | null | undefined

/**
 * Apply the same single-sample APY formula the legacy
 * `sui_indexer_alt_jsonrpc::api::governance::compute_apy` uses, just with
 * one window instead of 30:
 *
 *   rate = pool_token_amount / sui_amount     (decreases as rewards accrue)
 *   apy  = (rate_{N-1} / rate_N) ^ 365 - 1
 *
 * with the same outlier filter (`0 < apy < 0.1`) — anything outside that
 * band means the validator was just activated, slashed mid-epoch, or hit
 * some accounting hiccup; we'd rather show '--' than a number like -3%.
 */
function computeApy(rateN: unknown, rateN1: unknown): number | undefined {
  if (typeof rateN !== 'string' || typeof rateN1 !== 'string') return undefined
  const [suiN, tokN] = rateN.split(',')
  const [suiN1, tokN1] = rateN1.split(',')
  const suiNVal = Number(suiN)
  const tokNVal = Number(tokN)
  const suiN1Val = Number(suiN1)
  const tokN1Val = Number(tokN1)
  if (!suiNVal || !tokNVal || !suiN1Val || !tokN1Val) return undefined
  const rN = tokNVal / suiNVal
  const rN1 = tokN1Val / suiN1Val
  const apy = (rN1 / rN) ** 365 - 1
  if (apy > 0 && apy < 0.1) return apy
  return undefined
}

interface ValidatorsPage {
  nodes: ValidatorNode[]
  hasNextPage: boolean
  endCursor: string | null
}

async function fetchValidatorsPage(
  client: SuiGraphQLClient,
  after: string | null,
  formatRateN: string,
  formatRateN1: string
): Promise<ValidatorsPage> {
  const res = await client.query({
    query: VALIDATORS_WITH_RATES_QUERY,
    variables: { after, formatRateN, formatRateN1 },
  })
  if (res.errors?.length) {
    throw new Error(res.errors[0].message)
  }
  const conn = res.data?.epoch?.validatorSet?.activeValidators
  return {
    nodes: (conn?.nodes ?? []) as ValidatorNode[],
    hasNextPage: conn?.pageInfo?.hasNextPage ?? false,
    endCursor: conn?.pageInfo?.endCursor ?? null,
  }
}

function parseValidator(node: ValidatorNode): ValidatorSummary {
  const json = (node?.contents?.json ?? {}) as Record<string, unknown>
  const metadata = (json.metadata ?? {}) as Record<string, unknown>
  const stakingPool = (json.staking_pool ?? {}) as Record<string, unknown>
  const exchangeRates = (stakingPool.exchange_rates ?? {}) as Record<string, unknown>
  return {
    suiAddress: asAddress(metadata.sui_address),
    name: typeof metadata.name === 'string' ? metadata.name : '',
    imageUrl: typeof metadata.image_url === 'string' ? metadata.image_url : '',
    stakingPoolId: asAddress(stakingPool.id),
    stakingPoolSuiBalance: String(stakingPool.sui_balance ?? '0'),
    votingPower: String(json.voting_power ?? '0'),
    commissionRate: String(json.commission_rate ?? '0'),
    exchangeRatesTableId: asAddress(exchangeRates.id),
    apy: computeApy(node?.contents?.rateN, node?.contents?.rateN1),
  }
}

export const useLatestSuiSystemState = () => {
  const client = useCurrentClient()
  const { network } = useNetwork()

  const result = useQuery({
    queryKey: ['latestSuiSystemState', network],
    queryFn: async (): Promise<{ systemState: SystemStateSummary }> => {
      const probeRes = await client.query({ query: EPOCH_PROBE_QUERY })
      if (probeRes.errors?.length) {
        throw new Error(probeRes.errors[0].message)
      }
      const epoch = probeRes.data?.epoch
      if (!epoch) {
        throw new Error('epoch not available')
      }

      const sysJson = (epoch.systemState?.json ?? {}) as Record<string, unknown>
      const parameters = (sysJson.parameters ?? {}) as Record<string, unknown>
      const epochDurationMs = String(parameters.epoch_duration_ms ?? '0')
      const epochStartTimestampMs = epoch.startTimestamp
        ? String(new Date(epoch.startTimestamp).getTime())
        : '0'

      const epochN = BigInt(epoch.epochId)
      const epochN1 = epochN > 0n ? epochN - 1n : epochN
      const fmt = (e: bigint) =>
        `{staking_pool.exchange_rates->[${e}u64].sui_amount},{staking_pool.exchange_rates->[${e}u64].pool_token_amount}`
      const formatRateN = fmt(epochN)
      const formatRateN1 = fmt(epochN1)

      const activeValidators: ValidatorSummary[] = []
      let cursor: string | null = null
      let hasNextPage = true
      while (hasNextPage) {
        const conn = await fetchValidatorsPage(
          client,
          cursor,
          formatRateN,
          formatRateN1
        )
        for (const node of conn.nodes) {
          activeValidators.push(parseValidator(node))
        }
        hasNextPage = conn.hasNextPage
        cursor = conn.endCursor
      }

      return {
        systemState: {
          epoch: String(epoch.epochId),
          epochStartTimestampMs,
          epochDurationMs,
          activeValidators,
        },
      }
    },
    staleTime: 1000 * 60 * 1, // 1 minute
    gcTime: 1000 * 60 * 1, // 1 minute
  })

  return result
}

export default useLatestSuiSystemState
