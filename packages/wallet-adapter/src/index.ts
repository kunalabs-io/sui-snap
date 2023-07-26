import { SignedMessage, SignedTransaction, SuiTransactionBlockResponse } from '@mysten/sui.js'
import { WalletAdapter, WalletAdapterEvents } from '@mysten/wallet-adapter-base'
import {
  ReadonlyWalletAccount,
  SuiSignMessageInput,
  SuiSignTransactionBlockInput,
  WalletAccount,
} from '@mysten/wallet-standard'
import { ICON } from './icon'
import { BaseProvider } from '@metamask/providers'
import {
  SerializedWalletAccount,
  deserializeWalletAccount,
  serializeSuiSignMessageInput,
  serializeSuiSignTransactionBlockInput,
} from './types'

export * from './types'

export const snapOrigin = 'local:http://localhost:8080'

export async function getAccount(provider: BaseProvider): Promise<ReadonlyWalletAccount> {
  const res = (await provider.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: snapOrigin,
      request: {
        method: 'getAccount',
      },
    },
  })) as SerializedWalletAccount

  return new ReadonlyWalletAccount(deserializeWalletAccount(res))
}

export async function signMessage(
  provider: BaseProvider,
  messageInput: SuiSignMessageInput
): Promise<SignedMessage> {
  const serialized = serializeSuiSignMessageInput(messageInput)

  const res = (await provider.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: snapOrigin,
      request: {
        method: 'signMessage',
        params: {
          ...serialized,
        },
      },
    },
  })) as SignedMessage

  return res
}

export async function signTransactionBlock(
  provider: BaseProvider,
  transactionInput: SuiSignTransactionBlockInput
): Promise<SignedTransaction> {
  const serialized = serializeSuiSignTransactionBlockInput(transactionInput)

  const res = (await provider.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: snapOrigin,
      request: {
        method: 'signTransactionBlock',
        params: {
          ...serialized,
        },
      },
    },
  })) as SignedTransaction

  return res
}

export async function signAndExecuteTransactionBlock(
  provider: BaseProvider,
  transactionInput: SuiSignTransactionBlockInput
): Promise<SuiTransactionBlockResponse> {
  const serialized = serializeSuiSignTransactionBlockInput(transactionInput)

  const res = (await provider.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: snapOrigin,
      request: {
        method: 'signAndExecuteTransactionBlock',
        params: {
          ...serialized,
        },
      },
    },
  })) as SuiTransactionBlockResponse

  return res
}

export class SuiSnapWalletAdapter implements WalletAdapter {
  name = 'Sui MetaMask Snap'
  icon = ICON

  connecting: boolean
  connected: boolean

  #account: WalletAccount | null = null

  constructor() {
    this.connecting = false
    this.connected = true
  }

  static async flaskAvailable() {
    const provider = window.ethereum
    const version = await provider?.request<string>({ method: 'web3_clientVersion' })
    return version?.includes('flask')
  }

  async connect() {
    this.connecting = true
    this.connected = false

    try {
      const provider = window.ethereum
      if (!(await SuiSnapWalletAdapter.flaskAvailable())) {
        throw new Error('MetaMask Flask not detected!')
      }

      await provider.request({
        method: 'wallet_requestSnaps',
        params: {
          [snapOrigin]: {},
        },
      })

      this.#account = await getAccount(provider)

      this.connecting = false
      this.connected = true
    } catch (e) {
      this.connecting = false
      this.connected = false
      throw e
    }
  }

  async disconnect() {
    this.connecting = false
    this.connected = false
    this.#account = null
  }

  async getAccounts() {
    if (this.connected && this.#account) {
      return [this.#account]
    } else {
      return []
    }
  }

  signMessage: WalletAdapter['signMessage'] = async messageInput =>
    signMessage(window.ethereum, messageInput)

  signTransactionBlock: WalletAdapter['signTransactionBlock'] = async transactionInput =>
    signTransactionBlock(window.ethereum, transactionInput)

  signAndExecuteTransactionBlock: WalletAdapter['signAndExecuteTransactionBlock'] =
    async transactionInput => signAndExecuteTransactionBlock(window.ethereum, transactionInput)

  on: <E extends keyof WalletAdapterEvents>(
    event: E,
    callback: WalletAdapterEvents[E]
  ) => () => void = () => {
    return () => {
      /* noop */
    }
  }
}
