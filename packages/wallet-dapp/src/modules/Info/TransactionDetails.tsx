import { ReactNode } from 'react'
import styled from 'styled-components'

import Modal from 'components/Modal'
import ModalBody from 'components/Modal/components/ModalBody'
import Typography from 'components/Typography'
import { getFormattedDate } from 'utils/date'
import { useNetwork } from 'utils/useNetworkProvider'
import { IconLink } from 'components/Icons/IconLink'
import { BalanceChange, getTxFees } from 'utils/transaction'
import { ActivityTransaction } from 'utils/useTransactions'
import { ellipsizeTokenAddress } from 'utils/helpers'
import { IconClose } from 'components/Icons/IconClose'

interface Props {
  toggleModal: () => void
  balanceChanges?: BalanceChange[]
  tx?: ActivityTransaction
}

const IconSection = styled.div`
  position: absolute;
  right: 20px;
  top: 20px;
  & > svg {
    fill: ${p => p.theme.colors.text.description};
    cursor: pointer;
  }
`

const Title = styled(Typography)`
  color: ${p => p.theme.colors.text.description};
  text-align: center;
`

const Subtitle = styled(Typography)`
  color: ${p => p.theme.colors.text.description};
`

const DateTime = styled(Typography)`
  color: ${p => p.theme.colors.text.secondary};
  text-align: center;
`

const AmountChanged = styled(Typography)<{ isPositive: boolean }>`
  color: ${p => (p.isPositive ? '#28A745' : '#DC3545')};
`

const AmountChangedSymbol = styled(Typography)`
  color: ${p => p.theme.colors.text.alternative};
`

const TxLink = styled(Typography)`
  a {
    color: ${p => p.theme.colors.button.primary};
  }
  svg {
    margin-left: 4px;
  }
  cursor: pointer;
  text-align: center;
`

const TxBlockContainer = styled.div`
  border: 1px solid #bbc0c5;
  border-radius: 4px;
`

const TxBlockItem = styled(Typography)`
  color: ${p => p.theme.colors.text.alternative};
  a {
    color: ${p => p.theme.colors.button.primary};
  }
`

const Fee = styled(Typography)`
  color: ${p => p.theme.colors.text.description};
`

export const TransactionDetails = ({ toggleModal, tx, balanceChanges }: Props) => {
  const { network } = useNetwork()

  if (!tx) {
    return null
  }

  const txDate = tx.timestamp ? new Date(tx.timestamp) : null

  const txFees = getTxFees(tx.gas)

  return (
    <Modal onClose={toggleModal} style={{ padding: 20, maxHeight: 450 }}>
      <ModalBody>
        <Title variant="subtitle2" fontWeight="medium" style={{ marginBottom: 4 }}>
          Transaction
        </Title>
        <IconSection onClick={toggleModal}>
          <IconClose />
        </IconSection>
        {txDate && (
          <DateTime variant="caption" style={{ marginBottom: 4 }}>{`${getFormattedDate(
            txDate.toISOString().split('T')[0]
          )} ${txDate.toLocaleTimeString()}`}</DateTime>
        )}
        <TxLink variant="caption">
          <a
            href={`https://suivision.xyz/txblock/${tx.digest}?network=${network}`}
            target="_blank"
            rel="noreferrer"
            style={{ textDecoration: 'none' }}
          >
            {tx.digest}
            <IconLink />
          </a>
        </TxLink>
        {balanceChanges && balanceChanges.length ? (
          <div style={{ marginTop: 25 }}>
            <Subtitle fontWeight="medium" variant="body" style={{ marginBottom: 9 }}>
              Balance Changes
            </Subtitle>
            <div>
              {balanceChanges.map((balanceChange, i) => (
                <div
                  style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 6 }}
                  key={i}
                >
                  <AmountChanged
                    variant="caption"
                    isPositive={Number(balanceChange.amount || '') >= 0n}
                    style={{ marginRight: 3 }}
                  >
                    {balanceChange.amount}
                  </AmountChanged>
                  <AmountChangedSymbol variant="caption">{balanceChange.symbol}</AmountChangedSymbol>
                </div>
              ))}
            </div>
          </div>
        ) : null}
        {tx.commandSummaries.length > 0 && (
          <>
            <Subtitle fontWeight="medium" variant="body" style={{ marginBottom: 9, marginTop: 20 }}>
              Transaction Block
            </Subtitle>
            <TxBlockContainer>
              {tx.commandSummaries.map((block, index) => {
                // MoveCall summaries have the form `0x<pkg>::<mod>::<rest>`
                // where `<rest>` is the function name plus an optional
                // `<T1, T2, …>` type-arg suffix. Capture greedily so type
                // args containing `::` don't get split apart.
                const moveCall = block.match(/^(0x[0-9a-fA-F]+)::([^:]+)::(.+)$/)
                // TransferObjects summaries embed the destination address
                // (when resolvable) as `→ 0x<addr>`; turn it into a link
                // pointing at the recipient's account page.
                const transfer = block.match(
                  /^(TransferObjects\([^)]*?→ )(0x[0-9a-fA-F]+)(\))$/
                )
                let blockToDisplay: ReactNode = block
                if (moveCall) {
                  blockToDisplay = (
                    <>
                      <a
                        href={`https://suivision.xyz/object/${moveCall[1]}?network=${network}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ textDecoration: 'none' }}
                      >
                        {ellipsizeTokenAddress(moveCall[1])}
                      </a>
                      <span>::</span>
                      <span>{moveCall[2]}</span>
                      <span>::</span>
                      <span>{moveCall[3]}</span>
                    </>
                  )
                } else if (transfer) {
                  blockToDisplay = (
                    <>
                      <span>{transfer[1]}</span>
                      <a
                        href={`https://suivision.xyz/address/${transfer[2]}?network=${network}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ textDecoration: 'none' }}
                      >
                        {ellipsizeTokenAddress(transfer[2])}
                      </a>
                      <span>{transfer[3]}</span>
                    </>
                  )
                }
                return (
                  <div
                    key={`${block}-${index}`}
                    style={{
                      padding: '4px 8px',
                      borderBottom:
                        index === tx.commandSummaries.length - 1 ? 'none' : '1px solid #BBC0C5',
                    }}
                  >
                    <TxBlockItem variant="caption">{blockToDisplay}</TxBlockItem>
                  </div>
                )
              })}
            </TxBlockContainer>
          </>
        )}
        <Subtitle fontWeight="medium" variant="body" style={{ marginBottom: 6, marginTop: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>Transaction Fee Total</div>
            <div>{txFees?.total} SUI</div>
          </div>
        </Subtitle>
        <Fee variant="caption" style={{ marginBottom: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>Computation Fee</div>
            <div>{txFees?.computation} SUI</div>
          </div>
        </Fee>
        <Fee variant="caption" style={{ marginBottom: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>Storage Fee</div>
            <div>{txFees?.storage} SUI</div>
          </div>
        </Fee>
        <Fee variant="caption" style={{ marginBottom: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>Storage Rebate</div>
            <div>{txFees?.rebate} SUI</div>
          </div>
        </Fee>
      </ModalBody>
    </Modal>
  )
}
