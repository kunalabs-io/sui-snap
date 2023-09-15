import { NonAdminOrigin } from '@kunalabs-io/sui-snap-wallet/dist/errors'
import { IdentifierString, SuiChain } from '@mysten/wallet-standard'
import {
  DryRunTransactionBlockResponse,
  SuiClient,
} from '@mysten/sui.js/client'
import { TransactionBlock } from '@mysten/sui.js/transactions'
import { parseStructTag } from '@mysten/sui.js/utils'

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

export async function getFullnodeUrlForChain(
  chain: SuiChain | IdentifierString
) {
  const state = await getStoredState()
  switch (chain) {
    case 'sui:mainnet':
      return state.mainnetUrl
    case 'sui:testnet':
      return state.testnetUrl
    case 'sui:devnet':
      return state.devnetUrl
    case 'sui:localnet':
      return state.localnetUrl
    default:
      throw new Error(`Unsupported chain: ${chain}`)
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

export async function getBalanceChanges(
  client: SuiClient,
  dryRunRes: DryRunTransactionBlockResponse,
  sender: string
): Promise<Array<BalanceChange>> {
  const changes: Map<string, bigint> = new Map()
  for (const change of dryRunRes.balanceChanges) {
    if (
      change.owner === 'Immutable' ||
      !('AddressOwner' in change.owner) ||
      change.owner.AddressOwner !== sender
    ) {
      continue
    }
    const value = changes.get(change.coinType) ?? 0n
    changes.set(change.coinType, value + BigInt(change.amount))
  }

  const res = await Promise.all(
    Array.from(changes.entries()).map(async ([coinType, amount]) => {
      const metadata = await client.getCoinMetadata({ coinType })
      if (metadata === null) {
        return {
          symbol: getTokenSymbolAndNameFromTypeArg(coinType).name,
          amount: amount.toString(),
        }
      } else {
        const positive = amount >= 0n
        const abs = positive ? amount : -amount
        const integral = abs / 10n ** BigInt(metadata.decimals)
        const fractional = abs % 10n ** BigInt(metadata.decimals)

        let value = positive ? '+' : '-'
        value += integral.toString()
        if (fractional > 0n) {
          value += '.'
          value += fractional
            .toString()
            .padStart(metadata.decimals, '0')
            .replace(/0+$/, '')
        }

        return {
          symbol: metadata.symbol,
          amount: value,
        }
      }
    })
  )

  return res
}

function getErrorMessage(e: unknown): string {
  if (
    typeof e === 'object' &&
    e !== null &&
    'message' in e &&
    typeof e.message === 'string'
  ) {
    return e.message
  }
  return ''
}

export interface BuildTransactionBlockInput {
  chain: IdentifierString
  transactionBlock: TransactionBlock
  sender: string
}

export interface BuildTransactionBlockResult {
  transactionBlockBytes: Uint8Array | undefined
  balanceChanges: Array<BalanceChange> | undefined
  dryRunRes: DryRunTransactionBlockResponse | undefined
  isError: boolean
  errorMessage: string
}

export async function buildTransactionBlock(
  input: BuildTransactionBlockInput
): Promise<BuildTransactionBlockResult> {
  const url = await getFullnodeUrlForChain(input.chain)
  const client = new SuiClient({ url })

  input.transactionBlock.setSender(input.sender)

  let dryRunRes: DryRunTransactionBlockResponse | undefined = undefined
  let balanceChanges = undefined
  const dryRunError = { hasError: false, message: '' }
  try {
    dryRunRes = await client.dryRunTransactionBlock({
      transactionBlock: await input.transactionBlock.build({ client }),
    })
    if (dryRunRes.effects.status.status === 'failure') {
      dryRunError.hasError = true
      dryRunError.message = dryRunRes.effects.status.error || ''
    }
    balanceChanges = await getBalanceChanges(client, dryRunRes, input.sender)
  } catch (e: unknown) {
    dryRunError.hasError = true
    dryRunError.message = getErrorMessage(e)
  }

  if (!dryRunRes || !balanceChanges || dryRunError.hasError) {
    return {
      transactionBlockBytes: undefined,
      balanceChanges,
      dryRunRes,
      isError: true,
      errorMessage: dryRunError.message,
    }
  }

  let transactionBlockBytes
  try {
    transactionBlockBytes = await input.transactionBlock.build({
      client,
    })
  } catch (e) {
    return {
      transactionBlockBytes: undefined,
      balanceChanges,
      dryRunRes,
      isError: true,
      errorMessage: getErrorMessage(e),
    }
  }

  return {
    transactionBlockBytes,
    balanceChanges,
    dryRunRes,
    isError: false,
    errorMessage: '',
  }
}

export function calcTotalGasFeesDec(
  dryRunRes: DryRunTransactionBlockResponse
): number {
  const gasUsed = dryRunRes.effects.gasUsed
  const totalGasFeesInt =
    BigInt(gasUsed.computationCost) +
    BigInt(gasUsed.storageCost) -
    BigInt(gasUsed.storageRebate)

  return Number(totalGasFeesInt.toString()) / 1e9
}
