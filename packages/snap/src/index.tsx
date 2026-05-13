import type { Json, OnRpcRequestHandler } from '@metamask/snaps-sdk'
import {
  Banner,
  Bold,
  Box,
  Copyable,
  Divider,
  Heading,
  Link,
  Row,
  Section,
  Text,
} from '@metamask/snaps-sdk/jsx'
import type { JSXElement } from '@metamask/snaps-sdk/jsx'
import { SLIP10Node } from '@metamask/key-tree'

import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519'
import { toBase64 } from '@mysten/sui/utils'

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
  formatExecutionError,
  getStoredState,
  networkFromChain,
  updateState,
} from './util'
import type { IdentifierString } from '@mysten/wallet-standard'
import type {
  SuiSignAndExecuteTransactionOutput,
  SuiSignPersonalMessageOutput,
  SignedTransaction,
} from '@mysten/wallet-standard'
import type { Transaction } from '@mysten/sui/transactions'

/* ============================================================ *
 *  Helpers                                                     *
 * ============================================================ */

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

function prettyNetwork(chain: IdentifierString): string {
  switch (chain) {
    case 'sui:mainnet':
      return 'Sui mainnet'
    case 'sui:testnet':
      return 'Sui testnet'
    case 'sui:devnet':
      return 'Sui devnet'
    case 'sui:localnet':
      return 'Sui localnet'
    default:
      return chain
  }
}

/**
 * Human-readable description of a single PTB command. Move calls are
 * called out separately so the package id can be rendered as a link to
 * the network explorer; everything else is just a verb + tail.
 */
type CommandLabel =
  | { kind: 'move-call'; pkg: string; module: string; fn: string }
  | { kind: 'other'; verb: string; rest: string }

function summarizeCommands(tx: Transaction): CommandLabel[] {
  const out: CommandLabel[] = []
  for (const cmd of tx.getData().commands) {
    if ('MoveCall' in cmd && cmd.MoveCall) {
      const { module, function: fn, package: pkg } = cmd.MoveCall
      out.push({ kind: 'move-call', pkg, module, fn })
    } else if ('MergeCoins' in cmd && cmd.MergeCoins) {
      out.push({ kind: 'other', verb: 'Merge', rest: ` ${cmd.MergeCoins.sources.length + 1} coin objects` })
    } else if ('SplitCoins' in cmd && cmd.SplitCoins) {
      out.push({ kind: 'other', verb: 'Split', rest: ` a coin into ${cmd.SplitCoins.amounts.length} parts` })
    } else if ('TransferObjects' in cmd && cmd.TransferObjects) {
      out.push({ kind: 'other', verb: 'Transfer', rest: ` ${cmd.TransferObjects.objects.length} objects` })
    } else if ('Publish' in cmd && cmd.Publish) {
      out.push({ kind: 'other', verb: 'Publish', rest: ' a Move package' })
    } else if ('Upgrade' in cmd && cmd.Upgrade) {
      out.push({ kind: 'other', verb: 'Upgrade', rest: ' a Move package' })
    } else if ('MakeMoveVec' in cmd && cmd.MakeMoveVec) {
      out.push({ kind: 'other', verb: 'Build', rest: ' a Move vector' })
    }
  }
  return out
}

function ellipsizeAddress(addr: string): string {
  if (addr.length <= 12) {
    return addr
  }
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

/**
 * Render the package id of a MoveCall row. Returns a small muted Text
 * containing a Link to the network explorer when one is available, or
 * plain text for localnet (the snap-sdk's <Link> rejects non-https
 * URLs). Always lives on its own line below the function name so it
 * doesn't push the rest of the call signature onto a wrap.
 */
function renderPackageLine(pkg: string, chain: IdentifierString): JSXElement {
  const truncated = ellipsizeAddress(pkg)
  const network = networkFromChain(chain)
  if (network === 'localnet') {
    return (
      <Text size="sm" color="muted">
        {truncated}
      </Text>
    )
  }
  return (
    <Text size="sm" color="muted">
      <Link href={`https://suivision.xyz/package/${pkg}?network=${network}`}>
        {truncated}
      </Link>
    </Text>
  )
}

/* ============================================================ *
 *  Dialog content                                              *
 * ============================================================ */

function SummarySection({
  chain,
  fee,
}: {
  chain: IdentifierString
  fee?: number
}): JSXElement {
  return (
    <Section>
      <Row label="Network">
        <Text>{prettyNetwork(chain)}</Text>
      </Row>
      {fee !== undefined ? (
        <Row label="Estimated fee">
          <Text>{`${fee} SUI`}</Text>
        </Row>
      ) : null}
    </Section>
  )
}

function BalanceChangesSection({
  changes,
}: {
  changes: BalanceChange[] | undefined
}): JSXElement | null {
  if (!changes || changes.length === 0) {
    return null
  }
  return (
    <Section>
      <Heading size="sm">Balance changes</Heading>
      {changes.map(c => (
        <Row label={c.symbol}>
          <Text
            color={c.amount.startsWith('-') ? 'error' : 'success'}
            fontWeight="medium"
          >
            {c.amount}
          </Text>
        </Row>
      ))}
    </Section>
  )
}

function OperationsSection({
  tx,
  chain,
}: {
  tx: Transaction
  chain: IdentifierString
}): JSXElement | null {
  const cmds = summarizeCommands(tx)
  if (cmds.length === 0) {
    return null
  }
  return (
    <Section>
      <Heading size="sm">Operations</Heading>
      {cmds.map((cmd, i) => (
        <Row label={`#${i + 1}`}>
          {cmd.kind === 'move-call' ? (
            <Box>
              <Text>
                <Bold>Call</Bold> {cmd.module}::<Bold>{cmd.fn}</Bold>
              </Text>
              {renderPackageLine(cmd.pkg, chain)}
            </Box>
          ) : (
            <Text>
              <Bold>{cmd.verb}</Bold>
              {cmd.rest}
            </Text>
          )}
        </Row>
      ))}
    </Section>
  )
}

function FailedDialogContent({
  origin,
  chain,
  errorMessage,
  changes,
  tx,
  action,
}: {
  origin: string
  chain: IdentifierString
  errorMessage: string
  changes: BalanceChange[] | undefined
  tx: Transaction
  action: 'sign' | 'execute'
}): JSXElement {
  return (
    <Box>
      <Heading size="md">Transaction would fail</Heading>
      <Text color="muted">{origin}</Text>
      <Banner severity="danger" title="Dry run failed">
        <Text>
          {errorMessage ||
            `The transaction could not be ${action === 'sign' ? 'signed' : 'executed'} on ${prettyNetwork(chain)}.`}
        </Text>
      </Banner>
      <BalanceChangesSection changes={changes} />
      <OperationsSection tx={tx} chain={chain} />
    </Box>
  )
}

function TransactionDialogContent({
  origin,
  chain,
  fee,
  changes,
  tx,
  action,
}: {
  origin: string
  chain: IdentifierString
  fee: number
  changes: BalanceChange[] | undefined
  tx: Transaction
  action: 'sign' | 'execute'
}): JSXElement {
  return (
    <Box>
      <Heading size="md">
        {action === 'execute' ? 'Approve transaction' : 'Sign transaction'}
      </Heading>
      <Text color="muted">{origin}</Text>
      <SummarySection chain={chain} fee={fee} />
      <BalanceChangesSection changes={changes} />
      <OperationsSection tx={tx} chain={chain} />
      <Divider />
      <Text size="sm" color="muted">
        Manage your wallet at <Link href="https://suisnap.com/">suisnap.com</Link>
      </Text>
    </Box>
  )
}

function PersonalMessageDialogContent({
  origin,
  message,
}: {
  origin: string
  message: Uint8Array
}): JSXElement {
  const decoded = new TextDecoder().decode(message)
  // eslint-disable-next-line no-control-regex
  const isBinary = /[\x00-\x09\x0E-\x1F]/.test(decoded)

  return (
    <Box>
      <Heading size="md">Sign message</Heading>
      <Text color="muted">{origin}</Text>
      {isBinary ? (
        <Box>
          <Banner severity="warning" title="Binary message">
            <Text>
              The requested message is not human-readable. Its base64 encoding is shown below.
            </Text>
          </Banner>
          <Copyable value={toBase64(message)} />
        </Box>
      ) : (
        <Section>
          <Text>{decoded}</Text>
        </Section>
      )}
    </Box>
  )
}

/* ============================================================ *
 *  RPC entry point                                             *
 * ============================================================ */

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

      const response = await snap.request({
        method: 'snap_dialog',
        params: {
          type: 'confirmation',
          content: (
            <PersonalMessageDialogContent
              origin={origin}
              message={input.message}
            />
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

      if (result.isError) {
        await snap.request({
          method: 'snap_dialog',
          params: {
            type: 'alert',
            content: (
              <FailedDialogContent
                origin={origin}
                chain={input.chain}
                errorMessage={result.errorMessage}
                changes={result.balanceChanges}
                tx={input.transaction}
                action="sign"
              />
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
            <TransactionDialogContent
              origin={origin}
              chain={input.chain}
              fee={calcTotalGasFeesDec(result.simRes!)}
              changes={result.balanceChanges}
              tx={input.transaction}
              action="sign"
            />
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

      const keypair = await deriveKeypair()
      const sender = keypair.getPublicKey().toSuiAddress()
      const result = await buildTransaction({
        chain: input.chain,
        transaction: input.transaction,
        sender,
      })

      if (result.isError) {
        await snap.request({
          method: 'snap_dialog',
          params: {
            type: 'alert',
            content: (
              <FailedDialogContent
                origin={origin}
                chain={input.chain}
                errorMessage={result.errorMessage}
                changes={result.balanceChanges}
                tx={input.transaction}
                action="execute"
              />
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
            <TransactionDialogContent
              origin={origin}
              chain={input.chain}
              fee={calcTotalGasFeesDec(result.simRes!)}
              changes={result.balanceChanges}
              tx={input.transaction}
              action="execute"
            />
          ),
        },
      })

      if (response !== true) {
        throw UserRejectionError.asSimpleError()
      }

      const signed = await keypair.signTransaction(result.transactionBytes!)

      const execRes = await result.client.core.executeTransaction({
        transaction: result.transactionBytes!,
        signatures: [signed.signature],
        include: { effects: true },
      })

      if (execRes.$kind === 'FailedTransaction') {
        throw DryRunFailedError.asSimpleError(
          formatExecutionError(execRes.FailedTransaction.status)
        )
      }

      const effects = execRes.Transaction.effects
      const effectsBase64 = effects?.bcs ? toBase64(effects.bcs) : ''

      const ret: SuiSignAndExecuteTransactionOutput = {
        bytes: signed.bytes,
        signature: signed.signature,
        digest: execRes.Transaction.digest,
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
