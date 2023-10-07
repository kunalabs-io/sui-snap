import {
  ExecuteTransactionRequestType,
  SuiTransactionBlockResponseOptions,
} from '@mysten/sui.js/client'
import { TransactionBlock } from '@mysten/sui.js/transactions'
import { fromB64, toB64 } from '@mysten/sui.js/utils'
import {
  SuiSignAndExecuteTransactionBlockInput,
  SuiSignPersonalMessageInput,
  SuiSignTransactionBlockInput,
  WalletAccount,
  WalletIcon,
} from '@mysten/wallet-standard'
import {
  Infer,
  Describe,
  array,
  object,
  optional,
  string,
  boolean,
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
    publicKey: toB64(account.publicKey),
    features: [...account.features],
    chains: [...account.chains],
    label: account.label,
    icon: account.icon,
  }
}

export function deserializeWalletAccount(account: SerializedWalletAccount): WalletAccount {
  return {
    address: account.address,
    publicKey: fromB64(account.publicKey),
    chains: account.chains.map(chain => chain as `${string}:${string}`),
    features: account.features.map(feature => feature as `${string}:${string}`),
    label: account.label,
    icon: account.icon as WalletIcon,
  }
}

/* ======== SerializedSuiSignMessageInput ======== */

export const SerializedSuiSignPersonalMessageInput = object({
  message: string(),
  account: SerializedWalletAccount,
})

export type SerializedSuiSignMessageInput = Infer<typeof SerializedSuiSignPersonalMessageInput>

export function serializeSuiSignMessageInput(
  input: SuiSignPersonalMessageInput
): SerializedSuiSignMessageInput {
  return {
    message: toB64(input.message),
    account: serializeWalletAccount(input.account),
  }
}

export function deserializeSuiSignMessageInput(
  input: SerializedSuiSignMessageInput
): SuiSignPersonalMessageInput {
  return {
    message: fromB64(input.message),
    account: deserializeWalletAccount(input.account),
  }
}

/* ======== SerializedSuiSignTransactionBlockInput ======== */

export const SerializedSuiSignTransactionBlockInput = object({
  transactionBlock: string(),
  account: SerializedWalletAccount,
  chain: string(),
})

export type SerializedSuiSignTransactionBlockInput = Infer<
  typeof SerializedSuiSignTransactionBlockInput
>

export function serializeSuiSignTransactionBlockInput(
  input: SuiSignTransactionBlockInput
): SerializedSuiSignTransactionBlockInput {
  return {
    transactionBlock: input.transactionBlock.serialize(),
    account: serializeWalletAccount(input.account),
    chain: input.chain,
  }
}

export function deserializeSuiSignTransactionBlockInput(
  input: SerializedSuiSignTransactionBlockInput
): SuiSignTransactionBlockInput {
  return {
    transactionBlock: TransactionBlock.from(input.transactionBlock),
    account: deserializeWalletAccount(input.account),
    chain: input.chain as `${string}:${string}`,
  }
}

/* ======== SerializedSuiSignAndExecuteTransactionBlockInput ======== */

const SuiTransactionBlockResponseOptions: Describe<SuiTransactionBlockResponseOptions> = object({
  showBalanceChanges: optional(boolean()),
  showEffects: optional(boolean()),
  showEvents: optional(boolean()),
  showInput: optional(boolean()),
  showObjectChanges: optional(boolean()),
  showRawInput: optional(boolean()),
})

export const SerializedSuiSignAndExecuteTransactionBlockInput = object({
  transactionBlock: string(),
  account: SerializedWalletAccount,
  chain: string(),
  requestType: optional(string()),
  options: optional(SuiTransactionBlockResponseOptions),
})

export type SerializedSuiSignAndExecuteTransactionBlockInput = Infer<
  typeof SerializedSuiSignAndExecuteTransactionBlockInput
>

export function serializeSuiSignAndExecuteTransactionBlockInput(
  input: SuiSignAndExecuteTransactionBlockInput
): SerializedSuiSignAndExecuteTransactionBlockInput {
  return {
    transactionBlock: input.transactionBlock.serialize(),
    account: serializeWalletAccount(input.account),
    chain: input.chain,
    requestType: input.requestType,
    options: input.options,
  }
}

export function deserializeSuiSignAndExecuteTransactionBlockInput(
  input: SerializedSuiSignAndExecuteTransactionBlockInput
): SuiSignAndExecuteTransactionBlockInput {
  return {
    ...input,
    transactionBlock: TransactionBlock.from(input.transactionBlock),
    account: deserializeWalletAccount(input.account),
    chain: input.chain as `${string}:${string}`,
    requestType: input.requestType as ExecuteTransactionRequestType | undefined,
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
