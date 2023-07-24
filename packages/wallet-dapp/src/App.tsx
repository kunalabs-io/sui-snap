import { ReactNode } from 'react'
import Main from 'modules/Main'

export type RootProps = {
  children: ReactNode
}

export const App = () => {
  return <Main />
}
