import { ReactNode, createContext, useState } from 'react'
import styled, { ThemeProvider } from 'styled-components'
import { Footer, Header } from './components'
import { dark, light } from './config/theme'

import { GlobalStyle } from './config/theme'
import Main from 'modules/Main'
import { getThemePreference, setLocalStorage } from 'utils'
import { MetaMaskProvider } from 'hooks'

export type RootProps = {
  children: ReactNode
}

type ToggleTheme = () => void

export const ToggleThemeContext = createContext<ToggleTheme>((): void => undefined)

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 100vh;
  max-width: 100vw;
`

export const App = () => {
  const [darkTheme, setDarkTheme] = useState(getThemePreference())

  const toggleTheme: ToggleTheme = () => {
    setLocalStorage('theme', darkTheme ? 'light' : 'dark')
    setDarkTheme(!darkTheme)
  }

  return (
    <ToggleThemeContext.Provider value={toggleTheme}>
      <ThemeProvider theme={darkTheme ? dark : light}>
        <MetaMaskProvider>
          <GlobalStyle />
          <Wrapper>
            <Header handleToggleClick={toggleTheme} />
            <Main />
            <Footer />
          </Wrapper>
        </MetaMaskProvider>
      </ThemeProvider>
    </ToggleThemeContext.Provider>
  )
}
