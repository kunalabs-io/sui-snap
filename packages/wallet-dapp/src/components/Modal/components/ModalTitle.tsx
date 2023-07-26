import { ReactNode } from 'react'
import styled from 'styled-components'

import { IconClose } from 'components/Icons/IconClose'
import Typography from 'components/Typography'
import { Stylable } from 'utils/types'

interface Props extends Stylable {
  children: ReactNode
  onClose?: () => void
}

const TitleSection = styled(Typography)`
  align-items: center;
  border-bottom: 1px solid ${p => p.theme.colors.divider};
  display: flex;
  justify-content: space-between;
  padding-bottom: 16px;
`

const IconSection = styled.div`
  & > svg {
    fill: ${p => p.theme.colors.text.primary};
    &:hover {
      cursor: pointer;
    }
  }
`

const ModalTitle = ({ children, onClose, style }: Props) => (
  <TitleSection style={style} variant="subtitle1">
    {children}
    {onClose && (
      <IconSection onClick={onClose}>
        <IconClose />
      </IconSection>
    )}
  </TitleSection>
)

export default ModalTitle
