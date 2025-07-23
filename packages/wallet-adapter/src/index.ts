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
import { MetaMaskInpageProvider } from '@metamask/providers'
import {
  SerializedAdminSetFullnodeUrl,
  SerializedWalletAccount,
  StoredState,
  deserializeWalletAccount,
  serializeSuiSignAndExecuteTransactionBlockInput,
  serializeSuiSignMessageInput,
  serializeSuiSignTransactionBlockInput,
} from './types'
import { convertError } from './errors'
import { getMetaMaskProvider } from './metamask'

export * from './types'
export * from './errors'
export { getMetaMaskProvider } from './metamask'
export type { MetaMaskStatus, MetaMaskProviderInfo } from './metamask'

export const SNAP_ORIGIN = 'npm:@kunalabs-io/sui-metamask-snap'
export const SNAP_VERSION = '^1.0.0'

export function registerSuiSnapWallet(): SuiSnapWallet {
  const wallets = getWallets()
  for (const wallet of wallets.get()) {
    if (wallet.name === SuiSnapWallet.NAME) {
      console.warn('SuiSnapWallet already registered')
      return wallet as SuiSnapWallet
    }
  }

  const wallet = new SuiSnapWallet()
  wallets.register(wallet)
  return wallet
}

export async function getAccounts(provider: MetaMaskInpageProvider): Promise<ReadonlyWalletAccount[]> {
  const res = (await provider.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: SNAP_ORIGIN,
      request: {
        method: 'getAccounts',
      },
    },
  })) as [SerializedWalletAccount]

  return res.map(acc => new ReadonlyWalletAccount(deserializeWalletAccount(acc)))
}

export async function admin_getStoredState(provider: MetaMaskInpageProvider) {
  const res = (await provider.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: SNAP_ORIGIN,
      request: {
        method: 'admin_getStoredState',
      },
    },
  })) as StoredState

  return res
}

export async function admin_setFullnodeUrl(
  provider: MetaMaskInpageProvider,
  network: 'mainnet' | 'testnet' | 'devnet' | 'localnet',
  url: string
) {
  const params: SerializedAdminSetFullnodeUrl = {
    network,
    url,
  }
  await provider.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: SNAP_ORIGIN,
      request: {
        method: 'admin_setFullnodeUrl',
        params: JSON.parse(JSON.stringify(params)),
      },
    },
  })
}

export async function signPersonalMessage(
  provider: MetaMaskInpageProvider,
  messageInput: SuiSignPersonalMessageInput
): Promise<SuiSignPersonalMessageOutput> {
  const serialized = serializeSuiSignMessageInput(messageInput)

  try {
    return (await provider.request({
      method: 'wallet_invokeSnap',
      params: {
        snapId: SNAP_ORIGIN,
        request: {
          method: 'signPersonalMessage',
          params: JSON.parse(JSON.stringify(serialized)),
        },
      },
    })) as SuiSignPersonalMessageOutput
  } catch (e) {
    throw convertError(e)
  }
}

export async function signMessage(
  provider: MetaMaskInpageProvider,
  messageInput: SuiSignMessageInput
): Promise<SuiSignMessageOutput> {
  const res = await signPersonalMessage(provider, messageInput)

  return {
    messageBytes: res.bytes,
    signature: res.signature,
  }
}

export async function signTransactionBlock(
  provider: MetaMaskInpageProvider,
  transactionInput: SuiSignTransactionBlockInput
): Promise<SuiSignTransactionBlockOutput> {
  const serialized = serializeSuiSignTransactionBlockInput(transactionInput)

  try {
    return (await provider.request({
      method: 'wallet_invokeSnap',
      params: {
        snapId: SNAP_ORIGIN,
        request: {
          method: 'signTransactionBlock',
          params: JSON.parse(JSON.stringify(serialized)),
        },
      },
    })) as SuiSignTransactionBlockOutput
  } catch (e) {
    throw convertError(e)
  }
}

export async function signAndExecuteTransactionBlock(
  provider: MetaMaskInpageProvider,
  transactionInput: SuiSignTransactionBlockInput
): Promise<SuiSignAndExecuteTransactionBlockOutput> {
  const serialized = serializeSuiSignAndExecuteTransactionBlockInput(transactionInput)

  try {
    return (await provider.request({
      method: 'wallet_invokeSnap',
      params: {
        snapId: SNAP_ORIGIN,
        request: {
          method: 'signAndExecuteTransactionBlock',
          params: JSON.parse(JSON.stringify(serialized)),
        },
      },
    })) as SuiSignAndExecuteTransactionBlockOutput
  } catch (e) {
    throw convertError(e)
  }
}

export class SuiSnapWallet implements Wallet {
  static NAME = 'Sui MetaMask Snap'
  #connecting: boolean
  #connected: boolean

  #provider: MetaMaskInpageProvider | null = null
  #accounts: WalletAccount[] | null = null

  constructor() {
    this.#connecting = false
    this.#connected = false
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
    if (this.#connected && this.#accounts) {
      return this.#accounts
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
      const { available, provider, suiSnapInstalled } = await getMetaMaskProvider()
      if (!available) {
        throw new Error('MetaMask not detected!')
      }

      await provider.request({
        method: 'wallet_requestSnaps',
        params: {
          [SNAP_ORIGIN]: {
            version: SNAP_VERSION,
          },
        },
      })

      this.#provider = provider
      this.#accounts = await getAccounts(provider)

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
    this.#accounts = null
    this.#provider = null
  }

  #signPersonalMessage: SuiSignPersonalMessageMethod = async messageInput => {
    if (!this.#provider) {
      throw new Error('Not connected: Please connect to MetaMask Sui Snap before signing a personal message.')
    }
    return signPersonalMessage(this.#provider, messageInput)
  }

  #signMessage: SuiSignMessageMethod = async messageInput => {
    if (!this.#provider) {
      throw new Error('Not connected: Please connect to MetaMask Sui Snap before signing a message.')
    }
    return signMessage(this.#provider, messageInput)
  }

  #signTransactionBlock: SuiSignTransactionBlockMethod = async transactionInput => {
    if (!this.#provider) {
      throw new Error('Not connected: Please connect to MetaMask Sui Snap before signing a transaction block.')
    }
    return signTransactionBlock(this.#provider, transactionInput)
  }

  #signAndExecuteTransactionBlock: SuiSignAndExecuteTransactionBlockMethod = async transactionInput => {
    if (!this.#provider) {
      throw new Error('Not connected: Please connect to MetaMask Sui Snap before signing and executing a transaction block.')
    }
    return signAndExecuteTransactionBlock(this.#provider, transactionInput)
  }
}
