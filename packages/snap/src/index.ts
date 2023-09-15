import { OnRpcRequestHandler } from '@metamask/snaps-types'
import { divider, heading, panel, text } from '@metamask/snaps-ui'
import { SLIP10Node } from '@metamask/key-tree'
import { blake2b } from '@noble/hashes/blake2b'

import {
  Ed25519Keypair,
  Ed25519PublicKey,
} from '@mysten/sui.js/keypairs/ed25519'
import {
  IntentScope,
  Keypair,
  SignatureWithBytes,
  messageWithIntent,
  toSerializedSignature,
} from '@mysten/sui.js/cryptography'
import { toB64 } from '@mysten/sui.js/utils'
import { SuiClient } from '@mysten/sui.js/client'
import { TransactionBlock } from '@mysten/sui.js/transactions'

import {
  SerializedSuiSignAndExecuteTransactionBlockInput,
  SerializedSuiSignPersonalMessageInput,
  SerializedSuiSignTransactionBlockInput,
  SerializedWalletAccount,
  deserializeSuiSignAndExecuteTransactionBlockInput,
  deserializeSuiSignMessageInput,
  deserializeSuiSignTransactionBlockInput,
  validate,
  SerializedAdminSetFullnodeUrl,
} from '@kunalabs-io/sui-snap-wallet/dist/types'
import {
  DryRunFailedError,
  InvalidParamsError,
  InvalidRequestMethodError,
  UserRejectionError,
} from '@kunalabs-io/sui-snap-wallet/dist/errors'
import {
  BalanceChange,
  assertAdminOrigin,
  buildTransactionBlock,
  calcTotalGasFeesDec,
  getFullnodeUrlForChain,
  getStoredState,
  updateState,
} from './util'

/**
 * Derive the Ed25519 keypair from user's MetaMask seed phrase.
 *
 * @returns The keypair.
 */
async function deriveKeypair() {
  const res = await snap.request({
    method: 'snap_getBip32Entropy',
    params: {
      path: ['m', "44'", "784'"],
      curve: 'ed25519',
    },
  })

  let node = await SLIP10Node.fromJSON(res)
  node = await node.derive(["slip10:0'", "slip10:0'", "slip10:0'"])

  if (!node.privateKeyBytes) {
    throw new Error('No private key found.')
  }

  return Ed25519Keypair.fromSecretKey(node.privateKeyBytes)
}

function serializedWalletAccountForPublicKey(
  publicKey: Ed25519PublicKey
): SerializedWalletAccount {
  return {
    address: publicKey.toSuiAddress(),
    publicKey: publicKey.toBase64(),
    chains: ['sui:mainnet', 'sui:testnet', 'sui:devnet', 'sui:localnet'],
    features: [
      'sui:signAndExecuteTransactionBlock',
      'sui:signTransactionBlock',
      'sui:signPersonalMessage',
      'sui:signMessage',
    ],
  }
}

/**
 * Sign a message using the keypair, with the `PersonalMessage` intent.
 */
function signMessage(
  keypair: Keypair,
  message: Uint8Array
): SignatureWithBytes {
  const data = messageWithIntent(IntentScope.PersonalMessage, message)
  const pubkey = keypair.getPublicKey()
  const digest = blake2b(data, { dkLen: 32 })
  const signature = keypair.signData(digest)
  const signatureScheme = keypair.getKeyScheme()

  const serializedSignature = toSerializedSignature({
    signatureScheme,
    signature,
    pubKey: pubkey,
  })

  return {
    bytes: toB64(message),
    signature: serializedSignature,
  }
}

function genTxBlockTransactionsText(txb: TransactionBlock): string[] {
  const txStrings = []
  for (const tx of txb.blockData.transactions) {
    switch (tx.kind) {
      case 'MoveCall': {
        const target = tx.target.split('::')
        txStrings.push(`**Call** ${target[0]}::${target[1]}::**${target[2]}**`)
        continue
      }
      case 'MergeCoins': {
        txStrings.push(`**Merge** (${tx.sources.length + 1}) coin objects`)
        continue
      }
      case 'SplitCoins': {
        txStrings.push(`**Split** a coin into (${tx.amounts.length}) objects`)
        continue
      }
      case 'TransferObjects': {
        let recipient = undefined
        if (
          tx.address.kind === 'Input' &&
          typeof tx.address.value === 'string'
        ) {
          recipient = tx.address.value
        }
        let str = `**Transfer** (${tx.objects.length}) objects`
        if (recipient) {
          str += ` to ${recipient}`
        }

        txStrings.push(str)
      }
    }
  }

  return txStrings
}

function genBalanceChangesSection(
  balanceChanges: Array<BalanceChange> | undefined
) {
  if (!balanceChanges || balanceChanges.length === 0) {
    return []
  }

  return [
    divider(),
    text('**Balance Changes:**'),
    ...balanceChanges.map(change => text(`${change.amount} ${change.symbol}`)),
  ]
}

function genOperationsSection(transactionBlock: TransactionBlock) {
  return [
    divider(),
    text('**Operations:**'),
    ...genTxBlockTransactionsText(transactionBlock).map((str, n) =>
      text(`[${n + 1}] ${str}`)
    ),
  ]
}

/**
 * Handle incoming JSON-RPC requests, sent through `wallet_invokeSnap`.
 *
 * @param args - The request handler args as object.
 * @param args.origin - The origin of the request, e.g., the website that
 * invoked the snap.
 * @param args.request - A validated JSON-RPC request object.
 * @returns The result of `snap_dialog`.
 * @throws If the request method is not valid for this snap.
 */
export const onRpcRequest: OnRpcRequestHandler = async ({
  origin,
  request,
}) => {
  switch (request.method) {
    case 'signPersonalMessage': {
      const [err, serialized] = validate(
        request.params,
        SerializedSuiSignPersonalMessageInput
      )
      if (err !== undefined) {
        throw InvalidParamsError.asSimpleError(err.message)
      }
      const input = deserializeSuiSignMessageInput(serialized)

      const keypair = await deriveKeypair()

      let decodedMessage = new TextDecoder().decode(input.message)
      let info = `**${origin}** is requesting to sign the following message:`
      /* eslint-disable-next-line no-control-regex */
      if (/[\x00-\x09\x0E-\x1F]/.test(decodedMessage)) {
        decodedMessage = toB64(input.message)
        info = `**${origin}** is requesting to sign the following message (base64 encoded):`
      }

      const response = await snap.request({
        method: 'snap_dialog',
        params: {
          type: 'confirmation',
          content: panel([
            heading('Sign Message'),
            text(info),
            divider(),
            text(decodedMessage),
            divider(),
          ]),
        },
      })

      if (response !== true) {
        throw UserRejectionError.asSimpleError()
      }

      return signMessage(keypair, input.message)
    }

    case 'signTransactionBlock': {
      const [err, serialized] = validate(
        request.params,
        SerializedSuiSignTransactionBlockInput
      )
      if (err !== undefined) {
        throw InvalidParamsError.asSimpleError(err.message)
      }
      const input = deserializeSuiSignTransactionBlockInput(serialized)

      const keypair = await deriveKeypair()
      const sender = keypair.getPublicKey().toSuiAddress()
      const result = await buildTransactionBlock({
        chain: input.chain,
        transactionBlock: input.transactionBlock,
        sender,
      })

      const balanceChangesSection = genBalanceChangesSection(
        result.balanceChanges
      )
      const operationsSection = genOperationsSection(input.transactionBlock)

      if (result.isError) {
        let resultText = 'Dry run failed.'
        if (result.errorMessage) {
          resultText = `Dry run failed with the following error: **${result.errorMessage}**`
        }

        await snap.request({
          method: 'snap_dialog',
          params: {
            type: 'alert',
            content: panel([
              heading('Transaction failed.'),
              text(
                `**${origin}** is requesting to **sign** a transaction block for **${input.chain}** but the **dry run failed**.`
              ),
              ...balanceChangesSection,
              ...operationsSection,
              divider(),
              text(resultText),
            ]),
          },
        })

        throw DryRunFailedError.asSimpleError(result.errorMessage)
      }

      const response = await snap.request({
        method: 'snap_dialog',
        params: {
          type: 'confirmation',
          content: panel([
            heading('Sign a Transaction'),
            text(
              `**${origin}** is requesting to **sign** a transaction block for **${input.chain}**.`
            ),
            text('Hint: you can manage your wallet at https://suisnap.com/'),
            ...balanceChangesSection,
            ...operationsSection,
            divider(),
            text(
              `Estimated gas fees: **${calcTotalGasFeesDec(
                result.dryRunRes!
              )} SUI**`
            ),
          ]),
        },
      })

      if (response !== true) {
        throw UserRejectionError.asSimpleError()
      }

      return await keypair.signTransactionBlock(result.transactionBlockBytes!)
    }

    case 'signAndExecuteTransactionBlock': {
      const [err, serialized] = validate(
        request.params,
        SerializedSuiSignAndExecuteTransactionBlockInput
      )
      if (err !== undefined) {
        throw InvalidParamsError.asSimpleError(err.message)
      }

      const input =
        deserializeSuiSignAndExecuteTransactionBlockInput(serialized)

      const url = await getFullnodeUrlForChain(input.chain)
      const client = new SuiClient({ url })

      const keypair = await deriveKeypair()
      const sender = keypair.getPublicKey().toSuiAddress()
      const result = await buildTransactionBlock({
        chain: input.chain,
        transactionBlock: input.transactionBlock,
        sender,
      })

      const balanceChangesSection = genBalanceChangesSection(
        result.balanceChanges
      )
      const operationsSection = genOperationsSection(input.transactionBlock)

      if (result.isError) {
        let resultText = 'Dry run failed.'
        if (result.errorMessage) {
          resultText = `Dry run failed with the following error: **${result.errorMessage}**`
        }

        await snap.request({
          method: 'snap_dialog',
          params: {
            type: 'alert',
            content: panel([
              heading('Transaction failed.'),
              text(
                `**${origin}** is requesting to **execute** a transaction block on **${input.chain}** but the **dry run failed**.`
              ),
              ...balanceChangesSection,
              ...operationsSection,
              divider(),
              text(resultText),
            ]),
          },
        })

        throw DryRunFailedError.asSimpleError(result.errorMessage)
      }

      const response = await snap.request({
        method: 'snap_dialog',
        params: {
          type: 'confirmation',
          content: panel([
            heading('Approve a Transaction'),
            text(
              `**${origin}** is requesting to **execute** a transaction block on **${input.chain}**.`
            ),
            text('Hint: you can manage your wallet at https://suisnap.com/'),
            ...balanceChangesSection,
            ...operationsSection,
            divider(),
            text(
              `Estimated gas fees: **${calcTotalGasFeesDec(
                result.dryRunRes!
              )} SUI**`
            ),
          ]),
        },
      })

      if (response !== true) {
        throw UserRejectionError.asSimpleError()
      }

      return await client.signAndExecuteTransactionBlock({
        signer: keypair,
        ...input,
      })
    }

    case 'getAccounts': {
      const keypair = await deriveKeypair()
      return [serializedWalletAccountForPublicKey(keypair.getPublicKey())]
    }

    case 'admin_getStoredState': {
      assertAdminOrigin(origin)

      const ret = await getStoredState()
      return ret
    }

    case 'admin_setFullnodeUrl': {
      assertAdminOrigin(origin)

      const [err, params] = validate(
        request.params,
        SerializedAdminSetFullnodeUrl
      )
      if (err !== undefined) {
        throw InvalidParamsError.asSimpleError(err.message)
      }

      const state = await getStoredState()
      switch (params.network) {
        case 'mainnet':
          state.mainnetUrl = params.url
          break
        case 'testnet':
          state.testnetUrl = params.url
          break
        case 'devnet':
          state.devnetUrl = params.url
          break
        case 'localnet':
          state.localnetUrl = params.url
          break
      }
      await updateState(state)

      return
    }

    default:
      throw InvalidRequestMethodError.asSimpleError(request.method)
  }
}
