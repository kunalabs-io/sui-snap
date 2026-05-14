import { useQuery } from '@tanstack/react-query'
import { graphql } from '@mysten/sui/graphql/schema'

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
}

export interface SystemStateSummary {
  epoch: string
  epochStartTimestampMs: string
  epochDurationMs: string
  activeValidators: ValidatorSummary[]
}

/**
 * Coerce a value that might be a Move address/UID/ID — these can render as
 * a bare hex string, `{ bytes: "0x..." }`, or `{ id: { id: "0x..." } }`
 * depending on the type and the serializer version.
 */
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

// Mysten's GraphQL caps connection page size at 50, so we have to paginate
// the active-validator list (mainnet has ~150 validators). The two queries
// below are deliberately separate: the first one fetches epoch-level info
// alongside the first page, then we only re-query validator pages.
const SYSTEM_STATE_QUERY = graphql(`
  query getLatestSuiSystemState {
    epoch {
      epochId
      startTimestamp
      systemState {
        json
      }
      validatorSet {
        activeValidators(first: 50) {
          pageInfo {
            hasNextPage
            endCursor
          }
          nodes {
            contents {
              json
            }
          }
        }
      }
    }
  }
`)

const VALIDATORS_PAGE_QUERY = graphql(`
  query getActiveValidatorsPage($after: String) {
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
            }
          }
        }
      }
    }
  }
`)

type ValidatorContentsJson = { json?: unknown } | null | undefined
type ValidatorNode = { contents?: ValidatorContentsJson } | null | undefined

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
  }
}

export const useLatestSuiSystemState = () => {
  const client = useCurrentClient()
  const { network } = useNetwork()

  const result = useQuery({
    queryKey: ['latestSuiSystemState', network],
    queryFn: async (): Promise<{ systemState: SystemStateSummary; apyMap: Map<string, number> }> => {
      const res = await client.query({ query: SYSTEM_STATE_QUERY })
      if (res.errors?.length) {
        throw new Error(res.errors[0].message)
      }
      const epoch = res.data?.epoch
      if (!epoch) {
        throw new Error('epoch not available')
      }

      const sysJson = (epoch.systemState?.json ?? {}) as Record<string, unknown>
      const parameters = (sysJson.parameters ?? {}) as Record<string, unknown>
      const epochDurationMs = String(parameters.epoch_duration_ms ?? '0')

      const epochStartTimestampMs = epoch.startTimestamp
        ? String(new Date(epoch.startTimestamp).getTime())
        : '0'

      const activeValidators: ValidatorSummary[] = (
        epoch.validatorSet?.activeValidators?.nodes ?? []
      ).map(parseValidator)

      // Walk additional pages while the server reports more. The first
      // page (above) is bundled with the epoch info; subsequent pages hit
      // the validator-only query.
      let pageInfo = epoch.validatorSet?.activeValidators?.pageInfo
      while (pageInfo?.hasNextPage) {
        const nextRes = await client.query({
          query: VALIDATORS_PAGE_QUERY,
          variables: { after: pageInfo.endCursor },
        })
        if (nextRes.errors?.length) {
          throw new Error(nextRes.errors[0].message)
        }
        const conn = nextRes.data?.epoch?.validatorSet?.activeValidators
        for (const node of conn?.nodes ?? []) {
          activeValidators.push(parseValidator(node))
        }
        pageInfo = conn?.pageInfo
      }

      return {
        systemState: {
          epoch: String(epoch.epochId),
          epochStartTimestampMs,
          epochDurationMs,
          activeValidators,
        },
        // TODO: APY isn't exposed by the GraphQL or gRPC v2 endpoints — only
        // by the legacy JSON-RPC's `suix_getValidatorsApy`. We surface an
        // empty map so call sites that look up by address get `undefined`
        // and render '--'.
        apyMap: new Map<string, number>(),
      }
    },
    staleTime: 1000 * 60 * 1, // 1 minute
    gcTime: 1000 * 60 * 1, // 1 minute
  })

  return result
}

export default useLatestSuiSystemState
