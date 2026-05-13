import { NonAdminOrigin } from '@kunalabs-io/sui-snap-wallet/errors'
import { IdentifierString, SuiChain } from '@mysten/wallet-standard'
import { SuiJsonRpcClient } from '@mysten/sui/jsonRpc'
import type { SuiClientTypes } from '@mysten/sui/client'
import { Transaction } from '@mysten/sui/transactions'
import { parseStructTag } from '@mysten/sui/utils'

export const ALLOWED_ADMIN_ORIGIN = 'https://suisnap.com'

export const DEFAULT_MAINNET_URL = 'https://fullnode.mainnet.sui.io:443'
export const DEFAULT_TESTNET_URL = 'https://fullnode.testnet.sui.io:443'
export const DEFAULT_DEVNET_URL = 'https://fullnode.devnet.sui.io:443'
export const DEFAULT_LOCALNET_URL = 'http://127.0.0.1:9000'

type StoredState = {
  mainnetUrl: string
  testnetUrl: string
  devnetUrl: string
  localnetUrl: string
}

export function isAdminOrigin(origin: string) {
  return origin === ALLOWED_ADMIN_ORIGIN
}

export function assertAdminOrigin(origin: string) {
  if (!isAdminOrigin(origin)) {
    throw NonAdminOrigin.asSimpleError()
  }
}

export async function getStoredState(): Promise<StoredState> {
  const state = await snap.request({
    method: 'snap_manageState',
    params: { operation: 'get' },
  })

  if (state === null) {
    return {
      mainnetUrl: DEFAULT_MAINNET_URL,
      testnetUrl: DEFAULT_TESTNET_URL,
      devnetUrl: DEFAULT_DEVNET_URL,
      localnetUrl: DEFAULT_LOCALNET_URL,
    }
  }

  return state as StoredState
}

export async function updateState(newState: StoredState): Promise<void> {
  await snap.request({
    method: 'snap_manageState',
    params: { operation: 'update', newState },
  })
}

export type SuiNetwork = 'mainnet' | 'testnet' | 'devnet' | 'localnet'

export function networkFromChain(chain: SuiChain | IdentifierString): SuiNetwork {
  switch (chain) {
    case 'sui:mainnet':
      return 'mainnet'
    case 'sui:testnet':
      return 'testnet'
    case 'sui:devnet':
      return 'devnet'
    case 'sui:localnet':
      return 'localnet'
    default:
      throw new Error(`Unsupported chain: ${chain}`)
  }
}

export async function getFullnodeUrlForChain(
  chain: SuiChain | IdentifierString
) {
  const state = await getStoredState()
  const network = networkFromChain(chain)
  switch (network) {
    case 'mainnet':
      return state.mainnetUrl
    case 'testnet':
      return state.testnetUrl
    case 'devnet':
      return state.devnetUrl
    case 'localnet':
      return state.localnetUrl
  }
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

export interface BalanceChange {
  symbol: string
  amount: string
}

// The simulation result includes balance changes when requested. We thread the
// concrete result type so consumers can pull gas fees off it without re-typing.
export type SimResult = SuiClientTypes.SimulateTransactionResult<{
  effects: true
  balanceChanges: true
}>
export type SimSuccess = Extract<SimResult, { $kind: 'Transaction' }>

async function summarizeBalanceChanges(
  client: SuiJsonRpcClient,
  changes: SuiClientTypes.BalanceChange[],
  sender: string
): Promise<Array<BalanceChange>> {
  const grouped: Map<string, bigint> = new Map()
  for (const change of changes) {
    // The core-API BalanceChange is { coinType, address, amount }. We only
    // surface entries that touch the signer's address.
    if (change.address !== sender) {
      continue
    }
    const value = grouped.get(change.coinType) ?? 0n
    grouped.set(change.coinType, value + BigInt(change.amount))
  }

  return Promise.all(
    Array.from(grouped.entries()).map(async ([coinType, amount]) => {
      const { coinMetadata } = await client.core.getCoinMetadata({ coinType })
      if (coinMetadata === null) {
        return {
          symbol: getTokenSymbolAndNameFromTypeArg(coinType).name,
          amount: amount.toString(),
        }
      }

      const positive = amount >= 0n
      const abs = positive ? amount : -amount
      const integral = abs / 10n ** BigInt(coinMetadata.decimals)
      const fractional = abs % 10n ** BigInt(coinMetadata.decimals)

      let value = positive ? '+' : '-'
      value += integral.toString()
      if (fractional > 0n) {
        value += '.'
        value += fractional
          .toString()
          .padStart(coinMetadata.decimals, '0')
          .replace(/0+$/, '')
      }

      return {
        symbol: coinMetadata.symbol,
        amount: value,
      }
    })
  )
}

/**
 * Coerce an ExecutionStatus into a human-readable error string. In v2 the
 * `error` field is structured (MoveAbort / CommandArgumentError / ...), so
 * we collapse it back to a single line for the dialog.
 */
export function formatExecutionError(status: SuiClientTypes.ExecutionStatus): string {
  if (status.success || status.error == null) {
    return 'Dry run failed'
  }
  const err = status.error
  if (err.$kind === 'MoveAbort') {
    const abort = err.MoveAbort
    const loc = abort.location
    const where = loc?.functionName
      ? ` in ${loc.module ?? '?'}::${loc.functionName}`
      : ''
    return `Move abort (code ${abort.abortCode})${where}`
  }
  return err.$kind || 'Dry run failed'
}

function getErrorMessage(e: unknown): string | null {
  if (
    typeof e === 'object' &&
    e !== null &&
    'message' in e &&
    typeof e.message === 'string'
  ) {
    return e.message
  }
  return null
}

export interface BuildTransactionInput {
  chain: IdentifierString
  transaction: Transaction
  sender: string
}

export interface BuildTransactionResult {
  client: SuiJsonRpcClient
  transactionBytes: Uint8Array | undefined
  balanceChanges: Array<BalanceChange> | undefined
  simRes: SimSuccess | undefined
  isError: boolean
  errorMessage: string
}

export async function buildTransaction(
  input: BuildTransactionInput
): Promise<BuildTransactionResult> {
  const url = await getFullnodeUrlForChain(input.chain)
  const network = networkFromChain(input.chain)
  const client = new SuiJsonRpcClient({ url, network })

  input.transaction.setSender(input.sender)

  let transactionBytes: Uint8Array
  try {
    transactionBytes = await input.transaction.build({ client })
  } catch (e) {
    return {
      client,
      transactionBytes: undefined,
      balanceChanges: undefined,
      simRes: undefined,
      isError: true,
      errorMessage: getErrorMessage(e) ?? 'Unexpected error',
    }
  }

  let simResult: SimResult
  try {
    simResult = await client.core.simulateTransaction({
      transaction: transactionBytes,
      include: { effects: true, balanceChanges: true },
    })
  } catch (e) {
    return {
      client,
      transactionBytes: undefined,
      balanceChanges: undefined,
      simRes: undefined,
      isError: true,
      errorMessage: getErrorMessage(e) ?? 'Unexpected error',
    }
  }

  if (simResult.$kind === 'FailedTransaction') {
    const status = simResult.FailedTransaction.status
    return {
      client,
      transactionBytes: undefined,
      balanceChanges: undefined,
      simRes: undefined,
      isError: true,
      errorMessage: formatExecutionError(status),
    }
  }

  const balanceChanges = await summarizeBalanceChanges(
    client,
    simResult.Transaction.balanceChanges ?? [],
    input.sender
  )

  return {
    client,
    transactionBytes,
    balanceChanges,
    simRes: simResult,
    isError: false,
    errorMessage: '',
  }
}

export function calcTotalGasFeesDec(simRes: SimSuccess): number {
  const gasUsed = simRes.Transaction.effects!.gasUsed
  const totalGasFeesInt =
    BigInt(gasUsed.computationCost) +
    BigInt(gasUsed.storageCost) -
    BigInt(gasUsed.storageRebate)

  return Number(totalGasFeesInt.toString()) / 1e9
}
