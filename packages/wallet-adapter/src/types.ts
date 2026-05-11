import { Transaction } from '@mysten/sui/transactions'
import { fromBase64, toBase64 } from '@mysten/sui/utils'
import {
  SuiSignPersonalMessageInput,
  SuiSignTransactionInput,
  WalletAccount,
  WalletIcon,
} from '@mysten/wallet-standard'
import {
  Infer,
  array,
  object,
  optional,
  string,
  literal,
  union,
} from 'superstruct'

export { is, validate } from 'superstruct'

/**
 * Passing in objects directly to the Snap sometimes doesn't work correctly so we need to serialize to primitive values
 * and then deserialize on the other side.
 */

/* ======== SerializedWalletAccount ======== */

export const SerializedWalletAccount = object({
  address: string(),
  publicKey: string(),
  chains: array(string()),
  features: array(string()),
  label: optional(string()),
  icon: optional(string()),
})

export type SerializedWalletAccount = Infer<typeof SerializedWalletAccount>

export function serializeWalletAccount(account: WalletAccount): SerializedWalletAccount {
  return {
    address: account.address,
    publicKey: toBase64(new Uint8Array(account.publicKey)),
    features: [...account.features],
    chains: [...account.chains],
    label: account.label,
    icon: account.icon,
  }
}

export function deserializeWalletAccount(account: SerializedWalletAccount): WalletAccount {
  return {
    address: account.address,
    publicKey: fromBase64(account.publicKey),
    chains: account.chains.map(chain => chain as `${string}:${string}`),
    features: account.features.map(feature => feature as `${string}:${string}`),
    label: account.label,
    icon: account.icon as WalletIcon,
  }
}

/* ======== SerializedSuiSignPersonalMessageInput ======== */

export const SerializedSuiSignPersonalMessageInput = object({
  message: string(),
  account: SerializedWalletAccount,
})

export type SerializedSuiSignPersonalMessageInput = Infer<typeof SerializedSuiSignPersonalMessageInput>

export function serializeSuiSignPersonalMessageInput(
  input: SuiSignPersonalMessageInput
): SerializedSuiSignPersonalMessageInput {
  return {
    message: toBase64(input.message),
    account: serializeWalletAccount(input.account),
  }
}

export function deserializeSuiSignPersonalMessageInput(
  input: SerializedSuiSignPersonalMessageInput
): SuiSignPersonalMessageInput {
  return {
    message: fromBase64(input.message),
    account: deserializeWalletAccount(input.account),
  }
}

/* ======== SerializedSuiSignTransactionInput ======== */

export const SerializedSuiSignTransactionInput = object({
  transaction: string(),
  account: SerializedWalletAccount,
  chain: string(),
})

export type SerializedSuiSignTransactionInput = Infer<typeof SerializedSuiSignTransactionInput>

export async function serializeSuiSignTransactionInput(
  input: SuiSignTransactionInput
): Promise<SerializedSuiSignTransactionInput> {
  return {
    transaction: await input.transaction.toJSON(),
    account: serializeWalletAccount(input.account),
    chain: input.chain,
  }
}

export interface DeserializedSuiSignTransactionInput {
  transaction: Transaction
  account: WalletAccount
  chain: `${string}:${string}`
}

export function deserializeSuiSignTransactionInput(
  input: SerializedSuiSignTransactionInput
): DeserializedSuiSignTransactionInput {
  return {
    transaction: Transaction.from(input.transaction),
    account: deserializeWalletAccount(input.account),
    chain: input.chain as `${string}:${string}`,
  }
}

/* ======== StoredState ======== */

export interface StoredState {
  mainnetUrl: string
  testnetUrl: string
  devnetUrl: string
  localnetUrl: string
}

/* ======== SerializedAdminSetFullnodeUrl ======== */

export const SerializedAdminSetFullnodeUrl = object({
  network: union([literal('mainnet'), literal('testnet'), literal('devnet'), literal('localnet')]),
  url: string(),
})

export type SerializedAdminSetFullnodeUrl = Infer<typeof SerializedAdminSetFullnodeUrl>
