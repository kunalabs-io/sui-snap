import CoinItem, { Coin } from './CoinItem'

interface Props {
  coins: Coin[]
}

const CoinList = ({ coins }: Props) => {
  return (
    <div>
      {coins.map(c => (
        <CoinItem coin={c} key={c.symbol} />
      ))}
    </div>
  )
}

export default CoinList
