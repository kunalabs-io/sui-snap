import { ReactNode } from 'react'
import { Footer } from './components'

import Main from 'modules/Main'
import '../index.css'
import styled, { ThemeProvider } from 'styled-components'
import { GlobalStyle, theme } from 'config/theme'
import { registerSuiSnapWallet } from '@kunalabs-io/sui-snap-wallet'
import { SuiClientProvider, WalletProvider, createNetworkConfig } from '@mysten/dapp-kit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

registerSuiSnapWallet()

const { networkConfig } = createNetworkConfig({
  testnet: { url: 'https://fullnode.testnet.sui.io:443' },
})

const queryClient = new QueryClient()

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
  return (
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={queryClient}>
        <SuiClientProvider networks={networkConfig} network="testnet">
          <WalletProvider>
            <GlobalStyle />
            <Wrapper>
              <Main />
              <Footer />
            </Wrapper>
          </WalletProvider>
        </SuiClientProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}
