import { createGlobalStyle } from 'styled-components'

export const GlobalStyles = createGlobalStyle`
  html, body {
    margin: 0;
    padding: 0;
  }

  body {
     font-family: ${({ theme }) => theme.typography.family.Roboto} !important;
     background: ${({ theme }) => theme.colors.background.primary};
     color: ${({ theme }) => theme.colors.text.primary};
  }
  
  /* Chrome, Safari, Edge, Opera */
  input::-webkit-outer-spin-button,
  input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  /* Firefox */
  input[type=number] {
    -moz-appearance: textfield;
  }

  input:focus{
    outline: none;
  }
`
