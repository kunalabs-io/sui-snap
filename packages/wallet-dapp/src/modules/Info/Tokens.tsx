import { CoinInfo } from 'utils/useWalletBalances'
import CoinItem from './CoinItem'

interface Props {
  coins: CoinInfo[]
  onSendClick: (selectedCoin?: CoinInfo) => void
}

export const Tokens = ({ coins, onSendClick }: Props) => {
  return (
    <div>
      {coins.map(c => (
        <CoinItem coinInfo={c} key={c.meta.typeArg} onCoinClick={onSendClick} />
      ))}
    </div>
  )
}
