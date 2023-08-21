import styled from 'styled-components'

import { Props } from './Typography'

type StyledProps = Pick<Props, 'variant' | 'fontWeight' | 'color'>

export const StyledTypography = styled.div<StyledProps>`
  font-size: ${p => {
    switch (p.variant) {
      case 'title':
        return `${p.theme.typography.size.Title}px`
      case 'subtitle1':
        return `${p.theme.typography.size.Subtitle1}px`
      case 'subtitle2':
        return `${p.theme.typography.size.Subtitle2}px`
      case 'description':
        return `${p.theme.typography.size.Description}px`
      case 'body':
        return `${p.theme.typography.size.Body}px`
      case 'caption':
        return `${p.theme.typography.size.Caption}px`
      default:
        return `${p.theme.typography.size.Title}px`
    }
  }};

  font-weight: ${p =>
    p.fontWeight === 'bold'
      ? p.theme.typography.weight.Bold
      : p.fontWeight === 'medium'
      ? p.theme.typography.weight.Medium
      : p.theme.typography.weight.Regular};

  color: ${p => (p.color === 'primary' ? p.theme.colors.text.default : p.theme.colors.text.alternative)};
`
