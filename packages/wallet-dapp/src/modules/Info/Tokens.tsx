import { CoinInfo } from 'utils/useWalletBalances'
import CoinItem from './CoinItem'
import Accordion from 'components/Accordion'

interface Props {
  recognizedCoins: CoinInfo[]
  unrecognizedCoins: CoinInfo[]
  onSendClick: (selectedCoin?: CoinInfo) => void
}

export const Tokens = ({ recognizedCoins, unrecognizedCoins, onSendClick }: Props) => {
  return (
    <div>
      <div>
        {recognizedCoins.map(c => (
          <CoinItem coinInfo={c} key={c.meta.typeArg} onCoinClick={onSendClick} />
        ))}
      </div>
      {unrecognizedCoins.length ? (
        <Accordion
          isOpenInitial
          accordionSummary={`${unrecognizedCoins.length} Unrecognized Token${unrecognizedCoins.length > 1 ? 's' : ''}`}
          accordionSummaryStyles={{ padding: '0 14px' }}
          accordionDetails={
            <div style={{ marginTop: 10 }}>
              {unrecognizedCoins.map(c => (
                <CoinItem coinInfo={c} key={c.meta.typeArg} onCoinClick={onSendClick} />
              ))}
            </div>
          }
        />
      ) : null}
    </div>
  )
}
