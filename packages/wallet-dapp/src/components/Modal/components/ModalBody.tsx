import { ReactNode } from 'react'
import styled, { CSSProperties } from 'styled-components'

interface Props {
  children: ReactNode
  style?: CSSProperties
}
const BodySection = styled.div`
  overflow-y: auto;
`

const ModalBody = ({ children, style }: Props) => <BodySection style={style}>{children}</BodySection>

export default ModalBody
