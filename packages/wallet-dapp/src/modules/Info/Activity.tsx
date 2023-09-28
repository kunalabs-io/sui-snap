import styled from 'styled-components'
import { SuiTransactionBlockResponse } from '@mysten/sui.js/client'
import { useWalletKit } from '@mysten/wallet-kit'

import Spinner from 'components/Spinner'
import { WALLET_BALANCES_REFETCH_INTERVAL } from 'utils/const'
import { useTransactions } from 'utils/useTransactions'
import Typography from 'components/Typography'
import { IconArrowTransaction } from 'components/Icons/ArrowTransaction'
import { IconArrowReceived } from 'components/Icons/ArrowReceived'
import { useNetwork } from 'utils/useNetworkProvider'

const Container = styled.div`
  padding: 20px 0px;
`

const DateContainer = styled.div`
  padding: 10px 0;
`

const EmptyList = styled.div`
  padding: 24px;
  text-align: center;
  color: ${p => p.theme.colors.text.secondary};
`

const DateLabel = styled(Typography)`
  color: ${p => p.theme.colors.text.alternative};
  font-weight: 500;
  margin-bottom: 10px;
  padding: 0 24px;
`

const TransactionContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 10px 24px;
  cursor: pointer;

  &:hover {
    background-color: ${p => p.theme.colors.background.hover};
  }
`

const TransactionType = styled(Typography)`
  color: ${p => p.theme.colors.text.alternative};
  font-size: 15px;
  font-weight: 700;
`

const TimeLabel = styled(Typography)`
  font-size: 11px;
  color: ${p => p.theme.colors.text.secondary};
`

const TxBlockTexts = styled.div`
  width: 160px;
  font-size: 11px;
  color: ${p => p.theme.colors.text.alternative};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const AmountChanged = styled(Typography)<{ isPositive: boolean }>`
  color: ${p => (p.isPositive ? '#28A745' : '#DC3545')};
`

const AmountChangedSymbol = styled(Typography)`
  color: ${p => p.theme.colors.text.alternative};
`

export const Activity = () => {
  const { isLoading, transactions, balanceChanges, txBlockTexts } = useTransactions({
    refetchInterval: WALLET_BALANCES_REFETCH_INTERVAL,
  })

  const { currentAccount } = useWalletKit()
  const { network } = useNetwork()

  if (isLoading) {
    return <Spinner style={{ marginTop: 48 }} />
  }

  if (!transactions) {
    return null
  }

  if (transactions && transactions.length === 0) {
    return <EmptyList>The list is currently empty.</EmptyList>
  }

  const groupedTransactionsByDate = transactions.reduce(
    (result: Record<string, SuiTransactionBlockResponse[]>, item) => {
      const date = new Date(parseInt(item.timestampMs || '', 10) || '')
      const dateString = date.toISOString().split('T')[0]

      if (!result[dateString]) {
        result[dateString] = []
      }

      result[dateString].push(item as SuiTransactionBlockResponse)

      return result
    },
    {}
  )

  return (
    <Container>
      {Object.keys(groupedTransactionsByDate).map(dateKey => (
        <DateContainer key={dateKey}>
          <DateLabel variant="body">{dateKey}</DateLabel>
          {groupedTransactionsByDate[dateKey]
            .sort((tx1, tx2) => parseInt(tx2.timestampMs || '', 10) - parseInt(tx1.timestampMs || '', 10))
            .map((tx, i) => {
              const txDate = new Date(parseInt(tx.timestampMs || '', 10) || '')
              return (
                <a
                  key={`${tx.digest}-${i}`}
                  href={`https://suiexplorer.com/txblock/${tx.digest}?network=${network}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ textDecoration: 'none' }}
                >
                  <TransactionContainer>
                    {tx.transaction?.data.sender !== currentAccount?.address ? (
                      <IconArrowReceived />
                    ) : (
                      <IconArrowTransaction />
                    )}
                    <div style={{ marginLeft: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <TransactionType style={{ marginRight: 5 }}>
                          {tx.transaction?.data.sender !== currentAccount?.address ? 'Received' : 'Transaction'}
                        </TransactionType>
                        <TimeLabel>{`(${txDate.toLocaleTimeString()})`}</TimeLabel>
                      </div>
                      <TxBlockTexts>{txBlockTexts?.get(tx.digest)?.join(',')}</TxBlockTexts>
                    </div>
                    <div style={{ marginLeft: 'auto' }}>
                      {balanceChanges && balanceChanges.get(tx.digest) && (
                        <div>
                          {balanceChanges.get(tx.digest)?.map((balanceChange, i) => (
                            <div style={{ display: 'flex', justifyContent: 'flex-end' }} key={i}>
                              <AmountChanged
                                variant="caption"
                                fontWeight="medium"
                                isPositive={Number(balanceChange.amount || '') >= 0n}
                                style={{ marginRight: 3 }}
                              >
                                {balanceChange.amount}
                              </AmountChanged>
                              <AmountChangedSymbol variant="caption" fontWeight="medium">
                                {balanceChange.symbol}
                              </AmountChangedSymbol>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </TransactionContainer>
                </a>
              )
            })}
        </DateContainer>
      ))}
    </Container>
  )
}
