import { OnRpcRequestHandler } from '@metamask/snaps-types'
import { divider, heading, panel, text } from '@metamask/snaps-ui'
import { SLIP10Node } from '@metamask/key-tree'
import { blake2b } from '@noble/hashes/blake2b'

import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519'
import {
  IntentScope,
  Keypair,
  SignatureWithBytes,
  messageWithIntent,
  toSerializedSignature,
} from '@mysten/sui.js/cryptography'
import { toB64 } from '@mysten/sui.js/utils'
import {
  DryRunTransactionBlockResponse,
  SuiClient,
  getFullnodeUrl,
} from '@mysten/sui.js/client'
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
} from '@kunalabs-io/sui-snap-wallet-adapter/dist/types'
import {
  DryRunFailedError,
  InvalidParamsError,
  InvalidRequestMethodError,
  UserRejectionError,
} from '@kunalabs-io/sui-snap-wallet-adapter/dist/errors'
import { SuiChain } from '@mysten/wallet-standard'

function getFullnodeUrlForChain(chain: SuiChain | `${string}:${string}`) {
  switch (chain) {
    case 'sui:mainnet':
      return getFullnodeUrl('mainnet')
    case 'sui:testnet':
      return getFullnodeUrl('testnet')
    case 'sui:devnet':
      return getFullnodeUrl('devnet')
    case 'sui:localnet':
      return getFullnodeUrl('localnet')
    default:
      throw new Error(`Unsupported chain: ${chain}`)
  }
}

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

function calcTotalGasFeesDec(
  dryRunRes: DryRunTransactionBlockResponse
): number {
  const gasUsed = dryRunRes.effects.gasUsed
  const totalGasFeesInt =
    BigInt(gasUsed.computationCost) +
    BigInt(gasUsed.nonRefundableStorageFee) +
    BigInt(gasUsed.storageCost) -
    BigInt(gasUsed.storageRebate)

  return Number(totalGasFeesInt.toString()) / 1e9
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
      const url = getFullnodeUrlForChain(input.chain)
      const client = new SuiClient({ url })

      input.transactionBlock.setSender(keypair.getPublicKey().toSuiAddress())

      let dryRunRes: DryRunTransactionBlockResponse | undefined = undefined
      const dryRunError = { hasError: false, message: '' }
      try {
        dryRunRes = await client.dryRunTransactionBlock({
          transactionBlock: await input.transactionBlock.build({ client }),
        })
        if (dryRunRes.effects.status.status === 'failure') {
          dryRunError.hasError = true
          dryRunError.message = dryRunRes.effects.status.error || ''
        }
      } catch (e) {
        dryRunError.hasError = true
        dryRunError.message =
          typeof e === 'object' &&
          'message' in e &&
          typeof e.message === 'string'
            ? e.message
            : ''
      }
      if (!dryRunRes || dryRunError.hasError) {
        let resultText = 'Dry run failed.'
        if (dryRunError.message) {
          resultText = `Dry run failed with the following error: **${dryRunError.message}**`
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
              divider(),
              text('**Operations:**'),
              ...genTxBlockTransactionsText(input.transactionBlock).map(
                (str, n) => text(`[${n + 1}] ${str}`)
              ),
              divider(),
              text(resultText),
            ]),
          },
        })

        throw DryRunFailedError.asSimpleError(dryRunError.message)
      }

      const transactionBlockBytes = await input.transactionBlock.build({
        client,
      })

      const response = await snap.request({
        method: 'snap_dialog',
        params: {
          type: 'confirmation',
          content: panel([
            heading('Sign a Transaction'),
            text(
              `**${origin}** is requesting to **sign** a transaction block for **${input.chain}**.`
            ),
            divider(),
            text('**Operations:**'),
            ...genTxBlockTransactionsText(input.transactionBlock).map(
              (str, n) => text(`[${n + 1}] ${str}`)
            ),
            divider(),
            text(
              `Estimated gas fees: **${calcTotalGasFeesDec(dryRunRes)} SUI**`
            ),
          ]),
        },
      })

      if (response !== true) {
        throw UserRejectionError.asSimpleError()
      }

      return await keypair.signTransactionBlock(transactionBlockBytes)
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

      const keypair = await deriveKeypair()
      const url = getFullnodeUrlForChain(input.chain)
      const client = new SuiClient({ url })

      input.transactionBlock.setSender(keypair.getPublicKey().toSuiAddress())

      let dryRunRes: DryRunTransactionBlockResponse | undefined = undefined
      const dryRunError = { hasError: false, message: '' }
      try {
        dryRunRes = await client.dryRunTransactionBlock({
          transactionBlock: await input.transactionBlock.build({ client }),
        })
        if (dryRunRes.effects.status.status === 'failure') {
          dryRunError.hasError = true
          dryRunError.message = dryRunRes.effects.status.error || ''
        }
      } catch (e) {
        dryRunError.hasError = true
        dryRunError.message =
          typeof e === 'object' &&
          'message' in e &&
          typeof e.message === 'string'
            ? e.message
            : ''
      }
      if (!dryRunRes || dryRunError.hasError) {
        let resultText = 'Dry run failed.'
        if (dryRunError.message) {
          resultText = `Dry run failed with the following error: **${dryRunError.message}**`
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
              divider(),
              text('**Operations:**'),
              ...genTxBlockTransactionsText(input.transactionBlock).map(
                (str, n) => text(`[${n + 1}] ${str}`)
              ),
              divider(),
              text(resultText),
            ]),
          },
        })

        throw DryRunFailedError.asSimpleError(dryRunError.message)
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
            divider(),
            text('**Operations:**'),
            ...genTxBlockTransactionsText(input.transactionBlock).map(
              (str, n) => text(`[${n + 1}] ${str}`)
            ),
            divider(),
            text(
              `Estimated gas fees: **${calcTotalGasFeesDec(dryRunRes)} SUI**`
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

    case 'getAccount': {
      const keypair = await deriveKeypair()

      const account: SerializedWalletAccount = {
        address: keypair.getPublicKey().toSuiAddress(),
        publicKey: keypair.getPublicKey().toBase64(),
        chains: ['sui:mainnet', 'sui:testnet', 'sui:devnet', 'sui:localnet'],
        features: [
          'sui:signAndExecuteTransactionBlock',
          'sui:signTransactionBlock',
          'sui:signMessage',
        ],
      }

      return account
    }

    default:
      throw InvalidRequestMethodError.asSimpleError(request.method)
  }
}
