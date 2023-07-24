import { DefaultTheme } from 'styled-components'

import { themeColors } from './colors'
import { typography } from './typography'

export const theme: DefaultTheme = {
  colors: themeColors,
  typography,
}

// Need for typescript to detect theme fields
declare module 'styled-components' {
  export interface DefaultTheme {
    colors: typeof themeColors
    typography: typeof typography
  }
}
