import type { Json, OnRpcRequestHandler } from '@metamask/snaps-sdk'
import { Box, Heading, Text, Divider } from '@metamask/snaps-sdk/jsx'
import { SLIP10Node } from '@metamask/key-tree'

import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519'
import { toBase64 } from '@mysten/sui/utils'
import { SuiJsonRpcClient } from '@mysten/sui/jsonRpc'

import {
  SerializedSuiSignPersonalMessageInput,
  SerializedSuiSignTransactionInput,
  SerializedWalletAccount,
  deserializeSuiSignPersonalMessageInput,
  deserializeSuiSignTransactionInput,
  validate,
  SerializedAdminSetFullnodeUrl,
} from '@kunalabs-io/sui-snap-wallet/types'
import {
  DryRunFailedError,
  InvalidParamsError,
  InvalidRequestMethodError,
  UserRejectionError,
} from '@kunalabs-io/sui-snap-wallet/errors'
import {
  BalanceChange,
  assertAdminOrigin,
  buildTransaction,
  calcTotalGasFeesDec,
  getFullnodeUrlForChain,
  getStoredState,
  networkFromChain,
  updateState,
} from './util'
import type {
  SuiSignAndExecuteTransactionOutput,
  SuiSignPersonalMessageOutput,
  SignedTransaction,
} from '@mysten/wallet-standard'
import type { Transaction } from '@mysten/sui/transactions'

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

function serializedWalletAccountForKeypair(
  keypair: Ed25519Keypair
): SerializedWalletAccount {
  const publicKey = keypair.getPublicKey()
  return {
    address: publicKey.toSuiAddress(),
    publicKey: publicKey.toBase64(),
    chains: ['sui:mainnet', 'sui:testnet', 'sui:devnet', 'sui:localnet'],
    features: [
      'sui:signAndExecuteTransaction',
      'sui:signTransaction',
      'sui:signPersonalMessage',
    ],
  }
}

function genTxCommandsText(tx: Transaction): string[] {
  const txStrings: string[] = []
  for (const cmd of tx.getData().commands) {
    if ('MoveCall' in cmd && cmd.MoveCall) {
      const target = cmd.MoveCall.package + '::' + cmd.MoveCall.module + '::' + cmd.MoveCall.function
      txStrings.push(`**Call** ${cmd.MoveCall.package}::${cmd.MoveCall.module}::**${cmd.MoveCall.function}**`)
      void target
    } else if ('MergeCoins' in cmd && cmd.MergeCoins) {
      txStrings.push(`**Merge** (${cmd.MergeCoins.sources.length + 1}) coin objects`)
    } else if ('SplitCoins' in cmd && cmd.SplitCoins) {
      txStrings.push(`**Split** a coin into (${cmd.SplitCoins.amounts.length}) objects`)
    } else if ('TransferObjects' in cmd && cmd.TransferObjects) {
      txStrings.push(`**Transfer** (${cmd.TransferObjects.objects.length}) objects`)
    } else if ('Publish' in cmd && cmd.Publish) {
      txStrings.push('**Publish** a Move package')
    } else if ('Upgrade' in cmd && cmd.Upgrade) {
      txStrings.push('**Upgrade** a Move package')
    } else if ('MakeMoveVec' in cmd && cmd.MakeMoveVec) {
      txStrings.push('**MakeMoveVec**')
    }
  }

  return txStrings
}

function balanceChangesSection(
  balanceChanges: Array<BalanceChange> | undefined
) {
  if (!balanceChanges || balanceChanges.length === 0) {
    return null
  }

  return (
    <Box>
      <Divider />
      <Text>**Balance Changes:**</Text>
      {balanceChanges.map(change => (
        <Text>{`${change.amount} ${change.symbol}`}</Text>
      ))}
    </Box>
  )
}

function operationsSection(tx: Transaction) {
  const strings = genTxCommandsText(tx)
  return (
    <Box>
      <Divider />
      <Text>**Operations:**</Text>
      {strings.map((str, n) => (
        <Text>{`[${n + 1}] ${str}`}</Text>
      ))}
    </Box>
  )
}

/**
 * Handle incoming JSON-RPC requests, sent through `wallet_invokeSnap`.
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
      const input = deserializeSuiSignPersonalMessageInput(serialized)

      const keypair = await deriveKeypair()

      let decodedMessage = new TextDecoder().decode(input.message)
      let info = `**${origin}** is requesting to sign the following message:`
      /* eslint-disable-next-line no-control-regex */
      if (/[\x00-\x09\x0E-\x1F]/.test(decodedMessage)) {
        decodedMessage = toBase64(input.message)
        info = `**${origin}** is requesting to sign the following message (base64 encoded):`
      }

      const response = await snap.request({
        method: 'snap_dialog',
        params: {
          type: 'confirmation',
          content: (
            <Box>
              <Heading>Sign Message</Heading>
              <Text>{info}</Text>
              <Divider />
              <Text>{decodedMessage}</Text>
              <Divider />
            </Box>
          ),
        },
      })

      if (response !== true) {
        throw UserRejectionError.asSimpleError()
      }

      const signed = await keypair.signPersonalMessage(input.message)

      const ret: SuiSignPersonalMessageOutput = {
        bytes: signed.bytes,
        signature: signed.signature,
      }
      return ret as unknown as Json
    }

    case 'signTransaction': {
      const [err, serialized] = validate(
        request.params,
        SerializedSuiSignTransactionInput
      )
      if (err !== undefined) {
        throw InvalidParamsError.asSimpleError(err.message)
      }
      const input = deserializeSuiSignTransactionInput(serialized)

      const keypair = await deriveKeypair()
      const sender = keypair.getPublicKey().toSuiAddress()
      const result = await buildTransaction({
        chain: input.chain,
        transaction: input.transaction,
        sender,
      })

      const balancesUi = balanceChangesSection(result.balanceChanges)
      const operationsUi = operationsSection(input.transaction)

      if (result.isError) {
        let resultText = 'Dry run failed.'
        if (result.errorMessage) {
          resultText = `Dry run failed with the following error: **${result.errorMessage}**`
        }

        await snap.request({
          method: 'snap_dialog',
          params: {
            type: 'alert',
            content: (
              <Box>
                <Heading>Transaction failed.</Heading>
                <Text>{`**${origin}** is requesting to **sign** a transaction for **${input.chain}** but the **dry run failed**.`}</Text>
                {balancesUi}
                {operationsUi}
                <Divider />
                <Text>{resultText}</Text>
              </Box>
            ),
          },
        })

        throw DryRunFailedError.asSimpleError(result.errorMessage)
      }

      const response = await snap.request({
        method: 'snap_dialog',
        params: {
          type: 'confirmation',
          content: (
            <Box>
              <Heading>Sign a Transaction</Heading>
              <Text>{`**${origin}** is requesting to **sign** a transaction for **${input.chain}**.`}</Text>
              <Text>Hint: you can manage your wallet at https://suisnap.com/</Text>
              {balancesUi}
              {operationsUi}
              <Divider />
              <Text>{`Estimated gas fees: **${calcTotalGasFeesDec(result.dryRunRes!)} SUI**`}</Text>
            </Box>
          ),
        },
      })

      if (response !== true) {
        throw UserRejectionError.asSimpleError()
      }

      const signed = await keypair.signTransaction(result.transactionBytes!)

      const ret: SignedTransaction = {
        bytes: signed.bytes,
        signature: signed.signature,
      }
      return ret as unknown as Json
    }

    case 'signAndExecuteTransaction': {
      const [err, serialized] = validate(
        request.params,
        SerializedSuiSignTransactionInput
      )
      if (err !== undefined) {
        throw InvalidParamsError.asSimpleError(err.message)
      }

      const input = deserializeSuiSignTransactionInput(serialized)

      const url = await getFullnodeUrlForChain(input.chain)
      const network = networkFromChain(input.chain)
      const client = new SuiJsonRpcClient({ url, network })

      const keypair = await deriveKeypair()
      const sender = keypair.getPublicKey().toSuiAddress()
      const result = await buildTransaction({
        chain: input.chain,
        transaction: input.transaction,
        sender,
      })

      const balancesUi = balanceChangesSection(result.balanceChanges)
      const operationsUi = operationsSection(input.transaction)

      if (result.isError) {
        let resultText = 'Dry run failed.'
        if (result.errorMessage) {
          resultText = `Dry run failed with the following error: **${result.errorMessage}**`
        }

        await snap.request({
          method: 'snap_dialog',
          params: {
            type: 'alert',
            content: (
              <Box>
                <Heading>Transaction failed.</Heading>
                <Text>{`**${origin}** is requesting to **execute** a transaction on **${input.chain}** but the **dry run failed**.`}</Text>
                {balancesUi}
                {operationsUi}
                <Divider />
                <Text>{resultText}</Text>
              </Box>
            ),
          },
        })

        throw DryRunFailedError.asSimpleError(result.errorMessage)
      }

      const response = await snap.request({
        method: 'snap_dialog',
        params: {
          type: 'confirmation',
          content: (
            <Box>
              <Heading>Approve a Transaction</Heading>
              <Text>{`**${origin}** is requesting to **execute** a transaction on **${input.chain}**.`}</Text>
              <Text>Hint: you can manage your wallet at https://suisnap.com/</Text>
              {balancesUi}
              {operationsUi}
              <Divider />
              <Text>{`Estimated gas fees: **${calcTotalGasFeesDec(result.dryRunRes!)} SUI**`}</Text>
            </Box>
          ),
        },
      })

      if (response !== true) {
        throw UserRejectionError.asSimpleError()
      }

      const signed = await keypair.signTransaction(result.transactionBytes!)
      const txBytes = toBase64(result.transactionBytes!)

      const execRes = await client.executeTransactionBlock({
        transactionBlock: txBytes,
        signature: [signed.signature],
        options: {
          showRawEffects: true,
        } as { showRawEffects: true },
      })

      const rawEffects = (execRes as unknown as { rawEffects?: number[] }).rawEffects
      const effectsBase64 = rawEffects ? toBase64(Uint8Array.from(rawEffects)) : ''

      const ret: SuiSignAndExecuteTransactionOutput = {
        bytes: signed.bytes,
        signature: signed.signature,
        digest: execRes.digest,
        effects: effectsBase64,
      }
      return ret as unknown as Json
    }

    case 'getAccounts': {
      const keypair = await deriveKeypair()
      return [serializedWalletAccountForKeypair(keypair)]
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

      return null
    }

    default:
      throw InvalidRequestMethodError.asSimpleError(request.method)
  }
}
