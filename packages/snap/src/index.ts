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
import { parseStructTag, toB64 } from '@mysten/sui.js/utils'
import {
  DryRunTransactionBlockResponse,
  SuiClient,
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
  SerializedAdminSetFullnodeUrl,
} from '@kunalabs-io/sui-snap-wallet/dist/types'
import {
  DryRunFailedError,
  InvalidParamsError,
  InvalidRequestMethodError,
  NonAdminOrigin,
  UserRejectionError,
} from '@kunalabs-io/sui-snap-wallet/dist/errors'
import { SuiChain } from '@mysten/wallet-standard'

type StoredState = {
  mainnetUrl: string
  testnetUrl: string
  devnetUrl: string
  localnetUrl: string
}

const DEFAULT_FULLNODE_URLS = {
  mainnet: 'https://fullnode.mainnet.sui.io:443',
  testnet: 'https://fullnode.testnet.sui.io:443',
  devnet: 'https://fullnode.devnet.sui.io:443',
  localnet: 'http://127.0.0.1:9000',
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

async function getStoredState(): Promise<StoredState> {
  const state = await snap.request({
    method: 'snap_manageState',
    params: { operation: 'get' },
  })

  if (state === null) {
    return {
      mainnetUrl: DEFAULT_FULLNODE_URLS.mainnet,
      testnetUrl: DEFAULT_FULLNODE_URLS.testnet,
      devnetUrl: DEFAULT_FULLNODE_URLS.devnet,
      localnetUrl: DEFAULT_FULLNODE_URLS.localnet,
    }
  }

  return state as StoredState
}

async function getFullnodeUrlForChain(chain: SuiChain | `${string}:${string}`) {
  const state = await getStoredState()
  switch (chain) {
    case 'sui:mainnet':
      return state.mainnetUrl
    case 'sui:testnet':
      return state.testnetUrl
    case 'sui:devnet':
      return state.devnetUrl
    case 'sui:localnet':
      return state.localnetUrl
    default:
      throw new Error(`Unsupported chain: ${chain}`)
  }
}

async function updateState(newState: StoredState): Promise<void> {
  await snap.request({
    method: 'snap_manageState',
    params: { operation: 'update', newState },
  })
}

function isAdminOrigin(origin: string) {
  return origin === 'https://suisnap.com'
}

function assertAdminOrigin(origin: string) {
  if (!isAdminOrigin(origin)) {
    throw NonAdminOrigin.asSimpleError()
  }
}

function serialiedWalletAccountForKeypair(
  keypair: Ed25519Keypair
): SerializedWalletAccount {
  return {
    address: keypair.getPublicKey().toSuiAddress(),
    publicKey: keypair.getPublicKey().toBase64(),
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

export const getTokenSymbolAndNameFromTypeArg = (typeArg: string) => {
  const tag = parseStructTag(typeArg)

  const params = []
  for (const param of tag.typeParams) {
    if (typeof param === 'string') {
      params.push(param)
    } else {
      params.push(param.name)
    }
  }

  let name = tag.name
  if (params.length > 0) {
    name += `<${params.join(', ')}>`
  }

  return {
    name: name,
    symbol: tag.name,
  }
}

async function getBalanceChanges(
  client: SuiClient,
  dryRunRes: DryRunTransactionBlockResponse,
  sender: string
) {
  const changes: Map<string, bigint> = new Map()
  for (const change of dryRunRes.balanceChanges) {
    if (
      change.owner === 'Immutable' ||
      !('AddressOwner' in change.owner) ||
      change.owner.AddressOwner !== sender
    ) {
      continue
    }
    const value = changes.get(change.coinType) ?? 0n
    changes.set(change.coinType, value + BigInt(change.amount))
  }

  const res = await Promise.all(
    Array.from(changes.entries()).map(async ([coinType, amount]) => {
      const metadata = await client.getCoinMetadata({ coinType })
      if (metadata === null) {
        return {
          symbol: getTokenSymbolAndNameFromTypeArg(coinType).name,
          amount: amount.toString(),
        }
      } else {
        const positive = amount >= 0n
        const abs = positive ? amount : -amount
        const integral = abs / 10n ** BigInt(metadata.decimals)
        const fractional = abs % 10n ** BigInt(metadata.decimals)

        let value = positive ? '+' : '-'
        value += integral.toString()
        if (fractional > 0n) {
          value += '.'
          value += fractional
            .toString()
            .padStart(metadata.decimals, '0')
            .replace(/0+$/, '')
        }

        return {
          symbol: metadata.symbol,
          amount: value,
        }
      }
    })
  )

  return res
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
      const url = await getFullnodeUrlForChain(input.chain)
      const client = new SuiClient({ url })

      const sender = keypair.getPublicKey().toSuiAddress()
      input.transactionBlock.setSender(sender)

      let dryRunRes: DryRunTransactionBlockResponse | undefined = undefined
      let balanceChanges = undefined
      const dryRunError = { hasError: false, message: '' }
      try {
        dryRunRes = await client.dryRunTransactionBlock({
          transactionBlock: await input.transactionBlock.build({ client }),
        })
        if (dryRunRes.effects.status.status === 'failure') {
          dryRunError.hasError = true
          dryRunError.message = dryRunRes.effects.status.error || ''
        }
        balanceChanges = await getBalanceChanges(client, dryRunRes, sender)
      } catch (e) {
        dryRunError.hasError = true
        dryRunError.message =
          typeof e === 'object' &&
          'message' in e &&
          typeof e.message === 'string'
            ? e.message
            : ''
      }
      if (!dryRunRes || !balanceChanges || dryRunError.hasError) {
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
            text('Hint: you can manage your wallet at https://suisnap.com/'),
            divider(),
            text('**Balance Changes:**'),
            ...balanceChanges.map(change =>
              text(`${change.amount} ${change.symbol}`)
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
      const url = await getFullnodeUrlForChain(input.chain)
      const client = new SuiClient({ url })

      const sender = keypair.getPublicKey().toSuiAddress()
      input.transactionBlock.setSender(sender)

      let dryRunRes: DryRunTransactionBlockResponse | undefined = undefined
      let balanceChanges = undefined
      const dryRunError = { hasError: false, message: '' }
      try {
        dryRunRes = await client.dryRunTransactionBlock({
          transactionBlock: await input.transactionBlock.build({ client }),
        })
        if (dryRunRes.effects.status.status === 'failure') {
          dryRunError.hasError = true
          dryRunError.message = dryRunRes.effects.status.error || ''
        }
        balanceChanges = await getBalanceChanges(client, dryRunRes, sender)
      } catch (e) {
        dryRunError.hasError = true
        dryRunError.message =
          typeof e === 'object' &&
          'message' in e &&
          typeof e.message === 'string'
            ? e.message
            : ''
      }
      if (!dryRunRes || !balanceChanges || dryRunError.hasError) {
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
            text('Hint: you can manage your wallet at https://suisnap.com/'),
            divider(),
            text('**Balance Changes:**'),
            ...balanceChanges.map(change =>
              text(`${change.amount} ${change.symbol}`)
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

    case 'getAccounts': {
      const keypair = await deriveKeypair()
      return [serialiedWalletAccountForKeypair(keypair)]
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
