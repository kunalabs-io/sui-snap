import styled from 'styled-components'

import Typography from 'components/Typography/Typography'

export const IconButtonContainer = styled.div<{ disabled?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  cursor: ${p => (p.disabled ? 'not-allowed' : 'pointer')};
  opacity: ${p => (p.disabled ? 0.5 : 1)};
`

export const StyledTypography = styled(Typography)`
  color: ${p => p.theme.colors.text.description};
  margin-top: 6px;
`

export const TokensLabel = styled(Typography)<{ isActive: boolean }>`
  padding-bottom: 6px;
  padding-right: 24px;
  padding-left: 24px;
  color: ${p => p.theme.colors.button.primary};
  border-bottom: ${p => p.isActive && `1px solid ${p.theme.colors.button.primary}`};
  cursor: pointer;
`

export const Tabs = styled.div`
  margin-top: 25px;
  margin-bottom: 8px;
  text-align: center;
  // padding: 0 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
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
