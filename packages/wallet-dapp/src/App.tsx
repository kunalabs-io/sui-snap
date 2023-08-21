import { ReactNode, useCallback, useState } from 'react'
import { ThemeProvider } from 'styled-components'
import { WalletKitProvider } from '@mysten/wallet-kit'
import { registerSuiSnapWallet } from '@kunalabs-io/sui-snap-wallet-adapter'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

import Main from 'modules/Main'
import { GlobalStyles } from 'styles/GlobalStyles'
import { theme } from 'styles/theme'

import '../index.css'
import 'react-toastify/dist/ReactToastify.css'
import { SuiClientProvider } from 'utils/SuiClientProvider'
import { testnetConnectionUrl } from 'utils/const'
import { NetworkContext } from 'utils/useNetworkProvider'
import { Toast } from 'components/Toast/Toast'

export type RootProps = {
  children: ReactNode
}

const queryClient = new QueryClient()

registerSuiSnapWallet()

export const App = () => {
  const [network, setNetwork] = useState(testnetConnectionUrl)

  const handleNetworkChange = useCallback((newNetwork: string) => {
    setNetwork(newNetwork)
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <ReactQueryDevtools initialIsOpen={true} />
      <SuiClientProvider connectionUrl={network}>
        <WalletKitProvider>
          <NetworkContext.Provider value={{ network, setNetwork: handleNetworkChange }}>
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
