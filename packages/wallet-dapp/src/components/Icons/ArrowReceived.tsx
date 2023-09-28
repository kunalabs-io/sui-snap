import { IconBase, IconProps } from './Base'

export const IconArrowReceived = (props: IconProps) => (
  <IconBase width={32} height={32} viewBox="0 0 32 32" fill="none" {...props}>
    <circle cx="16" cy="16" r="16" fill="#E6F2FA" />
    <path
      d="M11 11L21 21M21 21H11M21 21V11"
      stroke="#0376C9"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </IconBase>
)
