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
  SerializedAdminSetFullnodeUrl,
  SerializedWalletAccount,
  StoredState,
  deserializeWalletAccount,
  serializeSuiSignAndExecuteTransactionBlockInput,
  serializeSuiSignMessageInput,
  serializeSuiSignTransactionBlockInput,
} from './types'
import { convertError } from './errors'

export * from './types'
export * from './errors'

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

export async function getAccounts(provider: BaseProvider): Promise<ReadonlyWalletAccount[]> {
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

export async function admin_getStoredState(provider: BaseProvider) {
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
  provider: BaseProvider,
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
  provider: BaseProvider,
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
  provider: BaseProvider,
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

export interface MetaMaskStatus {
  available: boolean
  version?: string
  supportsSnaps: boolean
  suiSnapInstalled: boolean
}

export async function metaMaskAvailable(): Promise<MetaMaskStatus> {
  const provider = window.ethereum
  if (!provider) {
    return {
      available: false,
      supportsSnaps: false,
      suiSnapInstalled: false,
    }
  }
  if (!provider.isMetaMask) {
    return {
      available: false,
      suiSnapInstalled: false,
      supportsSnaps: false,
    }
  }
  try {
    const version = await provider.request<string>({ method: 'web3_clientVersion' })
    const snaps = await provider.request<Record<string, unknown>>({ method: 'wallet_getSnaps' })
    const suiSnapInstalled = !!snaps && 'npm:@kunalabs-io/sui-metamask-snap' in snaps

    return {
      available: true,
      version: version!,
      supportsSnaps: true,
      suiSnapInstalled,
    }
  } catch (e) {
    console.warn(e)
    return {
      available: true,
      supportsSnaps: false,
      suiSnapInstalled: false,
    }
  }
}

export class SuiSnapWallet implements Wallet {
  static NAME = 'Sui MetaMask Snap'
  #connecting: boolean
  #connected: boolean

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
      const provider = window.ethereum
      const mmStatus = await metaMaskAvailable()
      if (!mmStatus.available) {
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
