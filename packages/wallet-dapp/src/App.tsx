import { ReactNode } from 'react'
import { ThemeProvider } from 'styled-components'
import { registerSuiSnapWallet } from '@kunalabs-io/sui-snap-wallet'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { DAppKitProvider } from '@mysten/dapp-kit-react'

import Main from 'modules/Main'
import { GlobalStyles } from 'styles/GlobalStyles'
import { theme } from 'styles/theme'

import 'react-toastify/dist/ReactToastify.css'
import { Toast } from 'components/Toast/Toast'
import { KioskClientProvider } from 'utils/KioskClientProvider'
import { dAppKit } from './dappkit'

export type RootProps = {
  children: ReactNode
}

const queryClient = new QueryClient()

registerSuiSnapWallet()

export const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ReactQueryDevtools initialIsOpen={true} />
      <DAppKitProvider dAppKit={dAppKit}>
        <KioskClientProvider>
          <ThemeProvider theme={theme}>
            <Toast />
            <Main />
            <GlobalStyles />
          </ThemeProvider>
        </KioskClientProvider>
      </DAppKitProvider>
    </QueryClientProvider>
  )
}
