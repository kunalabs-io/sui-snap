import { ReactNode } from 'react'
import { ThemeProvider } from 'styled-components'
import { WalletKitProvider } from '@mysten/wallet-kit'
import { registerSuiSnapWallet } from '@kunalabs-io/sui-snap-wallet-adapter'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

import Main from 'modules/Main'
import { GlobalStyles } from 'styles/GlobalStyles'
import { theme } from 'styles/theme'

import 'react-toastify/dist/ReactToastify.css'
import { SuiClientProvider } from 'utils/SuiClientProvider'
import { NETWORK, NetworkContext, chainFromNetwork, fullnodeUrlFromNetwork } from 'utils/useNetworkProvider'
import { Toast } from 'components/Toast/Toast'
import { useLocalStorage } from 'utils/useLocalStorage'

export type RootProps = {
  children: ReactNode
}

const queryClient = new QueryClient()

registerSuiSnapWallet()

export const App = () => {
  const [network, setNetwork] = useLocalStorage<NETWORK>('network', 'mainnet')
  const fullnodeUrl = fullnodeUrlFromNetwork(network)
  const chain = chainFromNetwork(network)

  return (
    <QueryClientProvider client={queryClient}>
      <ReactQueryDevtools initialIsOpen={true} />
      <SuiClientProvider connectionUrl={fullnodeUrl}>
        <WalletKitProvider>
          <NetworkContext.Provider value={{ network, fullnodeUrl, chain, setNetwork }}>
            <ThemeProvider theme={theme}>
              <Toast />
              <Main />
              <GlobalStyles />
            </ThemeProvider>
          </NetworkContext.Provider>
        </WalletKitProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  )
}
