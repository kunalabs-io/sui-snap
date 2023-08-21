import {
  ReadonlyWalletAccount,
  SUI_CHAINS,
  StandardConnectFeature,
  StandardConnectMethod,
  StandardDisconnectFeature,
  StandardDisconnectMethod,
  StandardEventsFeature,
  SuiFeatures,
  SuiSignAndExecuteTransactionBlockMethod,
  SuiSignAndExecuteTransactionBlockOutput,
  SuiSignMessageInput,
  SuiSignMessageMethod,
  SuiSignMessageOutput,
  SuiSignPersonalMessageInput,
  SuiSignPersonalMessageMethod,
  SuiSignPersonalMessageOutput,
  SuiSignTransactionBlockInput,
  SuiSignTransactionBlockMethod,
  SuiSignTransactionBlockOutput,
  Wallet,
  WalletAccount,
  getWallets,
} from '@mysten/wallet-standard'
import { ICON } from './icon'
import { BaseProvider } from '@metamask/providers'
import {
  SerializedWalletAccount,
  deserializeWalletAccount,
  serializeSuiSignAndExecuteTransactionBlockInput,
  serializeSuiSignMessageInput,
  serializeSuiSignTransactionBlockInput,
} from './types'

export * from './types'

export const snapOrigin = 'local:http://localhost:8080'

export function registerSuiSnapWallet(): SuiSnapWallet {
  const wallets = getWallets()
  if (wallets.get().find(w => w.name === SuiSnapWallet.NAME)) {
    console.warn('SuiSnapWallet already registered')
  }

  const wallet = new SuiSnapWallet()
  wallets.register(wallet)
  return wallet
}

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

export async function signPersonalMessage(
  provider: BaseProvider,
  messageInput: SuiSignPersonalMessageInput
): Promise<SuiSignPersonalMessageOutput> {
  const serialized = serializeSuiSignMessageInput(messageInput)

  const res = (await provider.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: snapOrigin,
      request: {
        method: 'signPersonalMessage',
        params: {
          ...serialized,
        },
      },
    },
  })) as SuiSignPersonalMessageOutput

  return res
}

export async function signMessage(
  provider: BaseProvider,
  messageInput: SuiSignMessageInput
): Promise<SuiSignMessageOutput> {
  const res = await signPersonalMessage(provider, messageInput)

  return {
    messageBytes: res.bytes,
    signature: res.signature,
  }
}

export async function signTransactionBlock(
  provider: BaseProvider,
  transactionInput: SuiSignTransactionBlockInput
): Promise<SuiSignTransactionBlockOutput> {
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
  })) as SuiSignTransactionBlockOutput

  return res
}

export async function signAndExecuteTransactionBlock(
  provider: BaseProvider,
  transactionInput: SuiSignTransactionBlockInput
): Promise<SuiSignAndExecuteTransactionBlockOutput> {
  const serialized = serializeSuiSignAndExecuteTransactionBlockInput(transactionInput)

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
  })) as SuiSignAndExecuteTransactionBlockOutput

  return res
}

export async function flaskAvailable(): Promise<boolean> {
  const provider = window.ethereum
  const version = await provider?.request<string>({ method: 'web3_clientVersion' })
  return !!version?.includes('flask')
}

export class SuiSnapWallet implements Wallet {
  #connecting: boolean
  static NAME = 'Sui MetaMask Snap'
  #connected: boolean

  #account: WalletAccount | null = null

  constructor() {
    this.#connecting = false
    this.#connected = true
  }

  get version() {
    return '1.0.0' as const
  }

  get name() {
    return SuiSnapWallet.NAME
  }

  get icon() {
    return ICON
  }

  get chains() {
    return SUI_CHAINS
  }

  get connecting() {
    return this.#connecting
  }

  get accounts() {
    if (this.#connected && this.#account) {
      return [this.#account]
    } else {
      return []
    }
  }

  get features(): StandardConnectFeature &
    StandardDisconnectFeature &
    SuiFeatures &
    StandardEventsFeature {
    return {
      'standard:connect': {
        version: '1.0.0',
        connect: this.#connect,
      },
      'standard:disconnect': {
        version: '1.0.0',
        disconnect: this.#disconnect,
      },
      'sui:signPersonalMessage': {
        version: '1.0.0',
        signPersonalMessage: this.#signPersonalMessage,
      },
      'sui:signMessage': {
        version: '1.0.0',
        signMessage: this.#signMessage,
      },
      'sui:signTransactionBlock': {
        version: '1.0.0',
        signTransactionBlock: this.#signTransactionBlock,
      },
      'sui:signAndExecuteTransactionBlock': {
        version: '1.0.0',
        signAndExecuteTransactionBlock: this.#signAndExecuteTransactionBlock,
      },
      'standard:events': {
        version: '1.0.0',
        on: () => {
          return () => {}
        },
      },
    }
  }

  #connect: StandardConnectMethod = async () => {
    if (this.#connecting) {
      throw new Error('Already connecting')
    }

    this.#connecting = true
    this.#connected = false

    try {
      const provider = window.ethereum
      if (!(await flaskAvailable())) {
        throw new Error('MetaMask Flask not detected!')
      }

      await provider.request({
        method: 'wallet_requestSnaps',
        params: {
          [snapOrigin]: {},
        },
      })

      this.#account = await getAccount(provider)

      this.#connecting = false
      this.#connected = true

      return {
        accounts: this.accounts,
      }
    } catch (e) {
      this.#connecting = false
      this.#connected = false
      throw e
    }
  }

  #disconnect: StandardDisconnectMethod = async () => {
    this.#connecting = false
    this.#connected = false
    this.#account = null
  }

  #signPersonalMessage: SuiSignPersonalMessageMethod = async messageInput =>
    signPersonalMessage(window.ethereum, messageInput)

  #signMessage: SuiSignMessageMethod = async messageInput =>
    signMessage(window.ethereum, messageInput)

  #signTransactionBlock: SuiSignTransactionBlockMethod = async transactionInput =>
    signTransactionBlock(window.ethereum, transactionInput)

  #signAndExecuteTransactionBlock: SuiSignAndExecuteTransactionBlockMethod =
    async transactionInput => signAndExecuteTransactionBlock(window.ethereum, transactionInput)
}
