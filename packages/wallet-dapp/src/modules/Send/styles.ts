import styled from 'styled-components'

import Typography from 'components/Typography/Typography'

export const SendLabel = styled(Typography)`
  color: ${p => p.theme.colors.text.description};
  text-align: center;
  margin-bottom: 20px;
`

export const GasLabel = styled(Typography)`
  font-weight: 700;
`

export const EstimatedLabel = styled(Typography)`
  font-style: italic;
  color: ${p => p.theme.colors.text.secondary};
  margin-left: 4px;
`

export const EstimatedUsd = styled(Typography)`
  color: ${p => p.theme.colors.text.description};
  margin-right: 8px;
`

export const EstimatedValue = styled(Typography)`
  color: ${p => p.theme.colors.text.description};
  font-weight: 700;
`
