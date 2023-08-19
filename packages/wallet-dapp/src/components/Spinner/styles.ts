import styled from 'styled-components'

export const StyledSpinner = styled.div`
  margin-top: 111px;
  margin-left: calc(50% - 24px);
  width: 48px;
  height: 48px;
  border: 5px solid ${p => p.theme.colors.button.primary};
  border-bottom-color: transparent;
  border-radius: 50%;
  display: inline-block;
  box-sizing: border-box;
  animation: rotation 1s linear infinite;
  }

  @keyframes rotation {
  0% {
      transform: rotate(0deg);
  }
  100% {
      transform: rotate(360deg);
  }
`
