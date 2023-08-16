import styled from 'styled-components'
import { ToastContainer } from 'react-toastify'

import { IconClose } from 'components/Icons/IconClose'

const CloseButton = styled.div`
  cursor: pointer;
  display: flex;
  align-items: center;
  &:hover {
    cursor: pointer;
  }
`
const StyledToastContainer = styled(ToastContainer).attrs({})`
  .Toastify__toast-container {
  }
  .Toastify__toast {
    padding: 16px;
    background-color: ${p => p.theme.colors.background.primary};
    color: ${p => p.theme.colors.text.primary};
    border: 1px solid ${p => p.theme.colors.divider};
    border-radius: 16px;
    font-size: ${p => p.theme.typography.size.Description}px;
    font-weight: ${p => p.theme.typography.weight.Medium};
    font-family: ${p => p.theme.typography.family.Roboto};
  }
  .Toastify__toast-body {
  }
`

export const Toast = () => {
  return (
    <StyledToastContainer
      position="bottom-left"
      autoClose={4000}
      hideProgressBar={true}
      closeButton={
        <CloseButton>
          <IconClose />
        </CloseButton>
      }
    />
  )
}
