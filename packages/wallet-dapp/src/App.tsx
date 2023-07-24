import { ReactNode } from 'react'
import { ThemeProvider } from 'styled-components'

import Main from 'modules/Main'
import { GlobalStyles } from 'styles/GlobalStyles'
import { theme } from 'styles/theme'

import '../index.css'

export type RootProps = {
  children: ReactNode
}

export const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <Main />
      <GlobalStyles />
    </ThemeProvider>
  )
}
