import styled from 'styled-components'

import Typography from 'components/Typography/Typography'

export const DashboardContainer = styled.div`
  position: absolute;
  top: 157px;
  width: 360px;
  height: 493px;
  overflow: auto;
`

export const AddressContainer = styled.div`
  padding: 8px 14px;
  border-radius: 22px;
  background: rgba(3, 118, 201, 0.1);
  cursor: pointer;
`

export const AddressTypography = styled(Typography)`
  color: ${p => p.theme.colors.button.primary};

  & > svg {
    margin-left: 4px;
  }
`

export const IconButtonContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
`

export const StyledTypography = styled(Typography)`
  color: ${p => p.theme.colors.text.description};
  margin-top: 6px;
`

export const TokensLabel = styled(Typography)`
  padding-bottom: 6px;
  color: ${p => p.theme.colors.button.primary};
  border-bottom: 1px solid ${p => p.theme.colors.button.primary};
`
