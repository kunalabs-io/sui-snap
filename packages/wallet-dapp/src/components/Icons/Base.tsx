import * as React from 'react'

export interface IconProps {
  viewBox?: string
  fill?: string
  stroke?: string
  width?: number
  height?: number
  style?: React.CSSProperties
  children?: React.ReactNode
}

export const IconBase = ({ children, ...rest }: IconProps) => <svg {...rest}>{children}</svg>
