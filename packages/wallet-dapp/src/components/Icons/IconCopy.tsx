import { useTheme } from 'styled-components'
import { IconBase, IconProps } from './Base'

export const IconCopy = (props: IconProps) => {
  const theme = useTheme()
  return (
    <IconBase width={11} height={11} viewBox="0 0 11 11" {...props}>
      <g clipPath="url(#clip0_1_5)">
        <path
          d="M7.69193 6.98293V9.29024C7.69193 11.222 6.93888 12 5.00245 12H2.68949C0.753056 12 0 11.222 0 9.29024V6.98293C0 5.07805 0.753056 4.3 2.68949 4.3H5.00245C6.93888 4.3 7.69193 5.07805 7.69193 6.98293ZM8.31051 1H5.99756C4.30318 1 3.49633 1.61707 3.33496 3.06585C3.30807 3.36098 3.55012 3.60244 3.87286 3.60244H5.00245C7.3154 3.60244 8.3912 4.67561 8.3912 6.98293V8.13659C8.3912 8.43171 8.63325 8.7 8.95599 8.64634C10.4083 8.48537 11 7.70732 11 6.01707V3.70976C11 1.77805 10.2469 1 8.31051 1Z"
          fill={theme.colors.button.primary}
        />
      </g>
      <defs>
        <clipPath id="clip0_1_5">
          <rect width="11" height="11" fill={theme.colors.button.primary} />
        </clipPath>
      </defs>
    </IconBase>
  )
}
