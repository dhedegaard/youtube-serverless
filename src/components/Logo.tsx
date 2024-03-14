import { SVGProps, memo } from 'react'

export const Logo = memo(function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" {...props}>
      <circle r={10} cx={10} cy={10} fill="#22BCDA" />
      <polygon fill="#fff" points="6,4 16,10 6,16" />
    </svg>
  )
})
