import { OnRpcRequestHandler } from '@metamask/snaps-types'
import { heading, panel, text } from '@metamask/snaps-ui'
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
import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client'

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
  InvalidParamsError,
  InvalidRequestMethodError,
  UserRejectionError,
} from '@kunalabs-io/sui-snap-wallet-adapter/dist/errors'

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

      const response = await snap.request({
        method: 'snap_dialog',
        params: {
          type: 'confirmation',
          content: panel([
            heading('Sign Message'),
            text(`**${origin}** is requesting to sign a message.`),
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

      const response = await snap.request({
        method: 'snap_dialog',
        params: {
          type: 'confirmation',
          content: panel([
            heading('Sign a Transaction'),
            text(`**${origin}** is requesting to sign a transaction block.`),
          ]),
        },
      })

      if (response !== true) {
        throw UserRejectionError.asSimpleError()
      }

      const keypair = await deriveKeypair()
      const url = getFullnodeUrl('testnet')

      const client = new SuiClient({ url })
      const transactionBlockBytes = await input.transactionBlock.build({
        client,
      })

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

      const response = await snap.request({
        method: 'snap_dialog',
        params: {
          type: 'confirmation',
          content: panel([
            heading('Approve a Transaction'),
            text(`**${origin}** is requesting to execute a transaction block.`),
          ]),
        },
      })

      if (response !== true) {
        throw UserRejectionError.asSimpleError()
      }

      const keypair = await deriveKeypair()
      const url = getFullnodeUrl('testnet')
      const client = new SuiClient({ url })

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
        chains: ['sui:devnet', 'sui:testnet', 'sui:localnet', 'sui:mainnet'],
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
