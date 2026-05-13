import { ReactNode } from 'react'
import { Footer } from './components'

import Main from 'modules/Main'
import '../index.css'
import styled, { ThemeProvider } from 'styled-components'
import { GlobalStyle, theme } from 'config/theme'
import { registerSuiSnapWallet } from '@kunalabs-io/sui-snap-wallet'
import { DAppKitProvider, createDAppKit } from '@mysten/dapp-kit-react'
import { SuiJsonRpcClient } from '@mysten/sui/jsonRpc'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

registerSuiSnapWallet()

const queryClient = new QueryClient()

const dAppKit = createDAppKit({
  networks: ['testnet'],
  defaultNetwork: 'testnet',
  autoConnect: true,
  createClient: network =>
    new SuiJsonRpcClient({ url: 'https://fullnode.testnet.sui.io:443', network }),
})

declare module '@mysten/dapp-kit-react' {
  interface Register {
    dAppKit: typeof dAppKit
  }
}

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
        <DAppKitProvider dAppKit={dAppKit}>
          <GlobalStyle />
          <Wrapper>
            <Main />
            <Footer />
          </Wrapper>
        </DAppKitProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}
