import { ReactNode, useState } from 'react'
import { Footer } from './components'
import { WalletKitProvider } from '@mysten/wallet-kit'
import { SuiSnapWalletAdapter } from 'sui-snap-wallet-adapter'
import { WalletStandardAdapterProvider } from '@mysten/wallet-adapter-wallet-standard'

import Main from 'modules/Main'
import '../index.css'
import { GlobalStyles } from 'styles/GlobalStyles'
import styled, { ThemeProvider } from 'styled-components'
import { theme } from 'styles/theme'
import { getThemePreference } from 'utils'
import { GlobalStyle, dark, light } from 'config/theme'

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

export const App = () => {
  const [darkTheme] = useState(getThemePreference())

  return (
    <ThemeProvider theme={darkTheme ? dark : light}>
      <WalletKitProvider adapters={[new WalletStandardAdapterProvider(), new SuiSnapWalletAdapter()]}>
        <GlobalStyle />
        <Wrapper>
          <Main />
          <Footer />
        </Wrapper>
      </WalletKitProvider>
    </ThemeProvider>
  )
}
