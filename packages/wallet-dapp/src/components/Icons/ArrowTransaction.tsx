import { IconBase, IconProps } from './Base'

export const IconArrowTransaction = (props: IconProps) => (
  <IconBase width={32} height={32} viewBox="0 0 32 32" fill="none" {...props}>
    <circle cx="16" cy="16" r="16" fill="#E6F2FA" />
    <path
      d="M11 21L21 11M21 11H11M21 11V21"
      stroke="#0376C9"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </IconBase>
)
