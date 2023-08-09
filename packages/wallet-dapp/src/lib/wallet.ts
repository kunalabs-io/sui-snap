import { SuiTransactionBlockResponse, TransactionBlock } from '@mysten/sui.js'
import { WalletAdapter } from '@mysten/wallet-adapter-base'

export interface Wallet {
  address: string
  signAndExecuteTransactionBlock: (transactionBlock: TransactionBlock) => Promise<SuiTransactionBlockResponse>
  signMessage: (message: Uint8Array) => ReturnType<WalletAdapter['signMessage']>
}
