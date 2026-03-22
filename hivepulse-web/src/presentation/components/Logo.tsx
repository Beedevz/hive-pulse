import { useMemo } from 'react'
import { useTheme } from '../../shared/useTheme'

export const Logo = ({ size = 28 }: { size?: number }) => {
  const { name } = useTheme()
  const c1 = name === 'dark' ? '#f5a623' : '#d4900e'
  const c2 = name === 'dark' ? '#e8891c' : '#b87a0a'
  const uid = useMemo(() => 'l' + Math.random().toString(36).slice(2, 5), [])
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <defs>
        <linearGradient id={uid + 'g'} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={c1} />
          <stop offset="100%" stopColor={c2} />
        </linearGradient>
      </defs>
      <path d="M50 6L86 27L86 73L50 94L14 73L14 27Z" fill="none"
        stroke={`url(#${uid}g)`} strokeWidth="5" strokeLinejoin="round" />
      <polyline points="26,54 38,54 43,44 50,62 57,38 63,54 74,54"
        fill="none" stroke={`url(#${uid}g)`} strokeWidth="3.5"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export const Wordmark = ({ size = 15 }: { size?: number }) => {
  const { theme } = useTheme()
  return (
    <span style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: size, fontWeight: 700 }}>
      <span style={{ color: theme.text }}>Hive</span>
      <span style={{ color: theme.accent }}>Pulse</span>
    </span>
  )
}
