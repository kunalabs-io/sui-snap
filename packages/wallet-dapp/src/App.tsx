import { ReactNode } from 'react'
import { ThemeProvider } from 'styled-components'
import { WalletKitProvider } from '@mysten/wallet-kit'
import { SuiSnapWalletAdapter } from '@kunalabs-io/sui-snap-wallet-adapter'

import Main from 'modules/Main'
import { GlobalStyles } from 'styles/GlobalStyles'
import { theme } from 'styles/theme'

import '../index.css'

export type RootProps = {
  children: ReactNode
}

export const App = () => {
  return (
    <WalletKitProvider adapters={[new SuiSnapWalletAdapter()]}>
      <ThemeProvider theme={theme}>
        <Main />
        <GlobalStyles />
      </ThemeProvider>
    </WalletKitProvider>
  )
}
