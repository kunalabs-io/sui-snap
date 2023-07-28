import Accordion from 'components/Accordion/Accordion'
import CoinItem from './CoinItem'

interface Coin {
  name: string
  symbol: string
  amount: string
}

interface Props {
  coins: Coin[]
}

const UnrecognizedTokens = ({ coins }: Props) => {
  return (
    <Accordion
      isOpenInitial
      accordionSummary={`${coins.length} Unrecognized Token`}
      accordionDetails={
        <div style={{ marginTop: 10 }}>
          {coins.map(c => (
            <CoinItem coin={c} key={c.symbol} />
          ))}
        </div>
      }
    />
  )
}

export default UnrecognizedTokens
