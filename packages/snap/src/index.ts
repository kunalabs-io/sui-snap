import { OnRpcRequestHandler } from '@metamask/snaps-types'
import { heading, panel, text } from '@metamask/snaps-ui'
import { SLIP10Node } from '@metamask/key-tree'
import { blake2b } from '@noble/hashes/blake2b'

import {
  Ed25519Keypair,
  IntentScope,
  JsonRpcProvider,
  Keypair,
  RawSigner,
  SignedMessage,
  messageWithIntent,
  testnetConnection,
  toB64,
  toSerializedSignature,
} from '@mysten/sui.js'

import {
  SerializedSuiSignAndExecuteTransactionBlockInput,
  SerializedSuiSignMessageInput,
  SerializedSuiSignTransactionBlockInput,
  SerializedWalletAccount,
  deserializeSuiSignAndExecuteTransactionBlockInput,
  deserializeSuiSignMessageInput,
  deserializeSuiSignTransactionBlockInput,
  is,
} from '@kunalabs-io/sui-snap-wallet-adapter/dist/types'

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
function signMessage(keypair: Keypair, message: Uint8Array): SignedMessage {
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
    messageBytes: toB64(message),
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
    case 'signMessage': {
      console.log(JSON.stringify(request.params, null, 2))
      if (!is(request.params, SerializedSuiSignMessageInput)) {
        throw new Error('Invalid request params.')
      }
      const input = deserializeSuiSignMessageInput(request.params)

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
        throw new Error('User rejected the signing.')
      }

      return signMessage(keypair, input.message)
    }

    case 'signTransactionBlock': {
      if (!is(request.params, SerializedSuiSignTransactionBlockInput)) {
        throw new Error('Invalid request params.')
      }
      const input = deserializeSuiSignTransactionBlockInput(request.params)

      const keypair = await deriveKeypair()
      const connection = testnetConnection

      const provider = new JsonRpcProvider(connection)
      const signer = new RawSigner(keypair, provider)

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
        throw new Error('User rejected the transaction.')
      }

      return await signer.signTransactionBlock({
        transactionBlock: input.transactionBlock,
      })
    }

    case 'signAndExecuteTransactionBlock': {
      if (
        !is(request.params, SerializedSuiSignAndExecuteTransactionBlockInput)
      ) {
        throw new Error('Invalid request params.')
      }
      const input = deserializeSuiSignAndExecuteTransactionBlockInput(
        request.params
      )

      const keypair = await deriveKeypair()
      const connection = testnetConnection

      const provider = new JsonRpcProvider(connection)
      const signer = new RawSigner(keypair, provider)

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
        throw new Error('User rejected the transaction.')
      }

      return await signer.signAndExecuteTransactionBlock({
        transactionBlock: input.transactionBlock,
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
      throw new Error(`Invalid request method: ${request.method}`)
  }
}
