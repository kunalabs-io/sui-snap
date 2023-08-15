import { ReactNode } from 'react'
import { ThemeProvider } from 'styled-components'
import { WalletKitProvider } from '@mysten/wallet-kit'
import { SuiSnapWalletAdapter } from '@kunalabs-io/sui-snap-wallet-adapter'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

import Main from 'modules/Main'
import { GlobalStyles } from 'styles/GlobalStyles'
import { theme } from 'styles/theme'

import '../index.css'
import { SuiClientProvider } from 'utils/SuiClientProvider'
import { testnetConnectionUrl } from 'utils/const'

export type RootProps = {
  children: ReactNode
}

const queryClient = new QueryClient()

// TODO: add different fullnode link depending on selected network (devnet, testnet or mainnet)
export const App = () => {
  const connectionUrl = testnetConnectionUrl

  return (
    <QueryClientProvider client={queryClient}>
      <ReactQueryDevtools initialIsOpen={true} />
      <SuiClientProvider connectionUrl={connectionUrl}>
        <WalletKitProvider adapters={[new SuiSnapWalletAdapter()]}>
          <ThemeProvider theme={theme}>
            <Main />
            <GlobalStyles />
          </ThemeProvider>
        </WalletKitProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  )
}
