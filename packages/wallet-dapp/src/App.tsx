import { ReactNode } from 'react'
import { ThemeProvider } from 'styled-components'
import { registerSuiSnapWallet } from '@kunalabs-io/sui-snap-wallet'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

import Main from 'modules/Main'
import { GlobalStyles } from 'styles/GlobalStyles'
import { theme } from 'styles/theme'

import 'react-toastify/dist/ReactToastify.css'
import { NETWORK, NetworkContext, chainFromNetwork, networkConfig } from 'utils/useNetworkProvider'
import { Toast } from 'components/Toast/Toast'
import { useLocalStorage } from 'utils/useLocalStorage'
import { KioskClientProvider } from 'utils/KioskClientProvider'
import { SuiClientProvider, WalletProvider } from '@mysten/dapp-kit'

export type RootProps = {
  children: ReactNode
}

const queryClient = new QueryClient()

registerSuiSnapWallet()

export const App = () => {
  const [network, setNetwork] = useLocalStorage<NETWORK>('network', 'mainnet')
  const chain = chainFromNetwork(network)

  return (
    <QueryClientProvider client={queryClient}>
      <ReactQueryDevtools initialIsOpen={true} />
      <SuiClientProvider networks={networkConfig} network={network}>
        <WalletProvider autoConnect={true}>
          <NetworkContext.Provider value={{ network, chain, setNetwork }}>
            <KioskClientProvider>
              <ThemeProvider theme={theme}>
                <Toast />
                <Main />
                <GlobalStyles />
              </ThemeProvider>
            </KioskClientProvider>
          </NetworkContext.Provider>
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  )
}
