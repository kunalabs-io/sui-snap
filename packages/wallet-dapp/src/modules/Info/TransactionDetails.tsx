import { ReactNode } from 'react'
import { SuiTransactionBlockResponse } from '@mysten/sui.js/client'
import styled from 'styled-components'

import Modal from 'components/Modal'
import ModalBody from 'components/Modal/components/ModalBody'
import Typography from 'components/Typography'
import { getFormattedDate } from 'utils/date'
import { useNetwork } from 'utils/useNetworkProvider'
import { IconLink } from 'components/Icons/IconLink'
import { BalanceChange, genTxBlockForTxDetails, getTxFees } from 'utils/transaction'
import { ellipsizeTokenAddress } from 'utils/helpers'
import { IconClose } from 'components/Icons/IconClose'

interface Props {
  toggleModal: () => void
  balanceChanges?: BalanceChange[]
  tx?: SuiTransactionBlockResponse
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

  const txDate = tx.timestampMs ? new Date(parseInt(tx.timestampMs, 10)) : null

  const txBlocks = genTxBlockForTxDetails(tx)

  const txFees = getTxFees(tx)

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
                <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 6 }} key={i}>
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
        <Subtitle fontWeight="medium" variant="body" style={{ marginBottom: 9, marginTop: 20 }}>
          Transaction Block
        </Subtitle>
        <TxBlockContainer>
          {txBlocks?.map((block, index) => {
            let blockToDisplay: ReactNode = block
            if (block.indexOf('::') !== -1) {
              const blockParts = block.split('::')
              blockToDisplay = (
                <>
                  <a
                    href={`https://suivision.xyz/object/${blockParts[0]}?network=${network}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ textDecoration: 'none' }}
                  >
                    {ellipsizeTokenAddress(blockParts[0])}
                  </a>
                  <span>::</span>
                  <span>{blockParts[1]}</span>
                  <span>::</span>
                  <span>{blockParts[2]}</span>
                </>
              )
            }
            return (
              <div
                key={`${block}-${index}`}
                style={{
                  padding: '4px 8px',
                  borderBottom: index === txBlocks.length - 1 ? 'none' : '1px solid #BBC0C5',
                }}
              >
                <TxBlockItem variant="caption">{blockToDisplay}</TxBlockItem>
              </div>
            )
          })}
        </TxBlockContainer>
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
