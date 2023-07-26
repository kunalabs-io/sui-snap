import { ReactNode } from 'react'
import styled, { CSSProperties } from 'styled-components'

interface Props {
  children: ReactNode
  style?: CSSProperties
}

const ActionsSection = styled.div`
  margin-top: 24px;
`

const ModalActions = ({ children, style }: Props) => <ActionsSection style={style}>{children}</ActionsSection>

export default ModalActions
