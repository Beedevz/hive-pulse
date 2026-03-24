interface LogoProps {
  size?: number
}

export function HivePulseLogo({ size = 32 }: Readonly<LogoProps>) {
  return (
    <img
      src="/hivepulse.svg"
      alt="HivePulse Logo"
      width={size}
      height={size}
      style={{ display: 'block' }}
    />
  )
}
