import { Stylable } from 'utils/types'
import { StyledSpinner } from './styles'

type Props = Stylable

const Spinner = ({ style, className }: Props) => {
  return <StyledSpinner style={style} className={className} />
}

export default Spinner
