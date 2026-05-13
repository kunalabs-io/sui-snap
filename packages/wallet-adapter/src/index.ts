import {
  ReadonlyWalletAccount,
  SUI_CHAINS,
  StandardConnectFeature,
  StandardConnectMethod,
  StandardDisconnectFeature,
  StandardDisconnectMethod,
  StandardEventsFeature,
  SuiFeatures,
  SuiSignAndExecuteTransactionMethod,
  SuiSignAndExecuteTransactionOutput,
  SuiSignPersonalMessageMethod,
  SuiSignPersonalMessageOutput,
  SuiSignTransactionMethod,
  SignedTransaction,
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
  serializeSuiSignPersonalMessageInput,
  serializeSuiSignTransactionInput,
} from './types'
import { convertError } from './errors'
import { getMetaMaskProvider } from './metamask'
import { SNAP_ORIGIN, SNAP_VERSION } from './snap'

export * from './types'
export * from './errors'
export { getMetaMaskProvider, subscribeMetaMaskProvider } from './metamask'
export type { MetaMaskStatus, MetaMaskProviderInfo } from './metamask'
export { SNAP_ORIGIN, SNAP_VERSION } from './snap'

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
  input: Parameters<SuiSignPersonalMessageMethod>[0]
): Promise<SuiSignPersonalMessageOutput> {
  const serialized = serializeSuiSignPersonalMessageInput(input)

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

export async function signTransaction(
  provider: MetaMaskInpageProvider,
  input: Parameters<SuiSignTransactionMethod>[0]
): Promise<SignedTransaction> {
  const serialized = await serializeSuiSignTransactionInput(input)

  try {
    return (await provider.request({
      method: 'wallet_invokeSnap',
      params: {
        snapId: SNAP_ORIGIN,
        request: {
          method: 'signTransaction',
          params: JSON.parse(JSON.stringify(serialized)),
        },
      },
    })) as SignedTransaction
  } catch (e) {
    throw convertError(e)
  }
}

export async function signAndExecuteTransaction(
  provider: MetaMaskInpageProvider,
  input: Parameters<SuiSignAndExecuteTransactionMethod>[0]
): Promise<SuiSignAndExecuteTransactionOutput> {
  const serialized = await serializeSuiSignTransactionInput(input)

  try {
    return (await provider.request({
      method: 'wallet_invokeSnap',
      params: {
        snapId: SNAP_ORIGIN,
        request: {
          method: 'signAndExecuteTransaction',
          params: JSON.parse(JSON.stringify(serialized)),
        },
      },
    })) as SuiSignAndExecuteTransactionOutput
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
        version: '1.1.0',
        signPersonalMessage: this.#signPersonalMessage,
      },
      'sui:signTransaction': {
        version: '2.0.0',
        signTransaction: this.#signTransaction,
      },
      'sui:signAndExecuteTransaction': {
        version: '2.0.0',
        signAndExecuteTransaction: this.#signAndExecuteTransaction,
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
      const { available, provider } = await getMetaMaskProvider()
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

  #signPersonalMessage: SuiSignPersonalMessageMethod = async input => {
    if (!this.#provider) {
      throw new Error('Not connected: Please connect to MetaMask Sui Snap before signing a personal message.')
    }
    return signPersonalMessage(this.#provider, input)
  }

  #signTransaction: SuiSignTransactionMethod = async input => {
    if (!this.#provider) {
      throw new Error('Not connected: Please connect to MetaMask Sui Snap before signing a transaction.')
    }
    return signTransaction(this.#provider, input)
  }

  #signAndExecuteTransaction: SuiSignAndExecuteTransactionMethod = async input => {
    if (!this.#provider) {
      throw new Error('Not connected: Please connect to MetaMask Sui Snap before signing and executing a transaction.')
    }
    return signAndExecuteTransaction(this.#provider, input)
  }
}
