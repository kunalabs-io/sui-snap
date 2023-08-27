import { ReactNode } from 'react'

import { Stylable } from 'utils/types'
import { StyledTypography } from './styles'

export interface Props extends Stylable {
  children: ReactNode
  variant?: 'title' | 'subtitle1' | 'subtitle2' | 'description' | 'body' | 'caption' | 'body-description'
  fontWeight?: 'bold' | 'medium' | 'regular'
  color?: 'primary' | 'secondary' | 'danger'
}

const Typography = ({
  children,
  variant = 'title',
  fontWeight = 'regular',
  color = 'primary',
  style,
  className,
}: Props) => {
  return (
    <StyledTypography variant={variant} fontWeight={fontWeight} color={color} style={style} className={className}>
      {children}
    </StyledTypography>
  )
}

export default Typography
