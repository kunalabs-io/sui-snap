import { theme } from 'config/theme'
import { typography } from './typography'

declare module 'styled-components' {
  export interface DefaultTheme {
    colors: (typeof theme)['colors']
    typography: typeof typography
  }
}
