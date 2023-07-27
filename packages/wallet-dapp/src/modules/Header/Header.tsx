import Jazzicon from 'react-jazzicon'

import Typography from 'components/Typography/Typography'
import Select, { Option } from 'components/Select/Select'
import { Wrapper } from './styles'
import { ellipsizeTokenAddress } from 'utils/tokenAddress'

const Header = () => {
  const handleOptionClick = (o: Option) => {
    console.log('handleOptionClick')
  }
  return (
    <Wrapper>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Jazzicon diameter={25} seed={Math.round(Math.random() * 10000000)} />
        <Typography variant="body" style={{ marginLeft: 12 }}>
          {ellipsizeTokenAddress('0xcc2bd176a478baea9a0de7a24cd927661cc6e860d5bacecb9a138ef20dbab231')}
        </Typography>
      </div>
      <Select
        options={[
          { name: 'Mainnet', value: 'mainnet' },
          { name: 'Testnet', value: 'testnet' },
        ]}
        onOptionClick={handleOptionClick}
      />
    </Wrapper>
  )
}

export default Header
