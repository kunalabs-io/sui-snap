import { ReactNode } from 'react'
import { Footer } from './components'
import { WalletKitProvider } from '@mysten/wallet-kit'

import Main from 'modules/Main'
import '../index.css'
import styled, { ThemeProvider } from 'styled-components'
import { GlobalStyle, theme } from 'config/theme'
import { registerSuiSnapWallet } from '@kunalabs-io/sui-snap-wallet-adapter'

export type RootProps = {
  children: ReactNode
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 100vh;
  max-width: 100vw;
`

registerSuiSnapWallet()

export const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <WalletKitProvider>
        <GlobalStyle />
        <Wrapper>
          <Main />
          <Footer />
        </Wrapper>
      </WalletKitProvider>
    </ThemeProvider>
  )
}
