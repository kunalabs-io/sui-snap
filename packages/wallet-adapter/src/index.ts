import { fromB64, toB64 } from '@mysten/sui.js'
import { WalletAdapter, WalletAdapterEvents } from '@mysten/wallet-adapter-base'
import { ReadonlyWalletAccount, WalletAccount } from '@mysten/wallet-standard'
import { ICON } from './icon'

export const snapOrigin = 'local:http://localhost:8080'

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

  async connect() {
    this.connecting = true
    this.connected = false

    const provider = window.ethereum
    const version = await provider?.request({ method: 'web3_clientVersion' })
    const isFlask = version?.includes('flask')
    if (!isFlask) {
      throw new Error('MetaMask Flask not detected!')
    }

    await provider.request({
      method: 'wallet_requestSnaps',
      params: {
        [snapOrigin]: {},
      },
    })

    const account = await provider.request({
      method: 'wallet_invokeSnap',
      params: {
        snapId: snapOrigin,
        request: {
          method: 'getAccount',
        },
      },
    })
    this.#account = new ReadonlyWalletAccount({
      ...account,
      publicKey: fromB64(account.publicKey),
    })

    this.connecting = false
    this.connected = true
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

  signMessage: WalletAdapter['signMessage'] = async messageInput => {
    return await window.ethereum.request({
      method: 'wallet_invokeSnap',
      params: {
        snapId: snapOrigin,
        request: {
          method: 'signMessage',
          params: {
            messageB64: toB64(messageInput.message),
            account: messageInput.account,
          },
        },
      },
    })
  }

  signTransactionBlock: WalletAdapter['signTransactionBlock'] = async transactionInput => {
    return await window.ethereum.request({
      method: 'wallet_invokeSnap',
      params: {
        snapId: snapOrigin,
        request: {
          method: 'signTransactionBlock',
          params: {
            serializedTransactionBlock: transactionInput.transactionBlock.serialize(),
            account: transactionInput.account,
            chain: transactionInput.chain,
          },
        },
      },
    })
  }

  signAndExecuteTransactionBlock: WalletAdapter['signAndExecuteTransactionBlock'] =
    async transactionInput => {
      return await window.ethereum.request({
        method: 'wallet_invokeSnap',
        params: {
          snapId: snapOrigin,
          request: {
            method: 'signAndExecuteTransactionBlock',
            params: {
              serializedTransactionBlock: transactionInput.transactionBlock.serialize(),
              account: transactionInput.account,
              chain: transactionInput.chain,
            },
          },
        },
      })
    }

  on: <E extends keyof WalletAdapterEvents>(
    event: E,
    callback: WalletAdapterEvents[E]
  ) => () => void = () => {
    return () => {
      /* noop */
    }
  }
}
