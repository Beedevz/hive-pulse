import React from 'react'
import { useTheme } from '../../../shared/useTheme'

interface ButtonProps {
  children: React.ReactNode
  onClick?: () => void
  primary?: boolean
  type?: 'button' | 'submit'
  disabled?: boolean
  fullWidth?: boolean
}

export const Button = ({ children, onClick, primary = true, type = 'button', disabled, fullWidth }: ButtonProps) => {
  const { theme } = useTheme()
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      style={{ background: primary ? theme.accent : theme.surface,
        color: primary ? '#0f0f0f' : theme.text2,
        border: primary ? 'none' : `1px solid ${theme.border}`,
        borderRadius: 6, padding: '7px 14px', cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: "'IBM Plex Mono',monospace", fontSize: 10.5, fontWeight: 600,
        width: fullWidth ? '100%' : undefined, opacity: disabled ? 0.6 : 1 }}>
      {children}
    </button>
  )
}
