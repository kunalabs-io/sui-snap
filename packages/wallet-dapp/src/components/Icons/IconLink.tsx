import { IconBase, IconProps } from './Base'

export const IconLink = (props: IconProps) => (
  <IconBase width={props.width || 7} height={props.height || 7} viewBox="0 0 7 7" {...props}>
    <path
      d="M0.791504 6.20832L6.20817 0.791656M6.20817 0.791656H0.791504M6.20817 0.791656V6.20832"
      stroke="#0376C9"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </IconBase>
)
