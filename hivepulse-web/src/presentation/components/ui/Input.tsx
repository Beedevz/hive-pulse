import React from 'react'
import { useTheme } from '../../../shared/useTheme'

interface InputProps {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  disabled?: boolean
}

export const Input = ({ label, value, onChange, placeholder, type = 'text', disabled }: InputProps) => {
  const { theme } = useTheme()
  const id = label.toLowerCase().replace(/\s+/g, '-')
  return (
    <div style={{ marginBottom: 10 }}>
      <label htmlFor={id} style={{ display: 'block', fontFamily: "'IBM Plex Mono',monospace", fontSize: 9,
        color: theme.text3, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 3 }}>
        {label}
      </label>
      <input
        id={id}
        type={type} value={value} placeholder={placeholder} disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        style={{ width: '100%', background: theme.input, border: `1px solid ${theme.border}`,
          borderRadius: 6, padding: '7px 10px', fontFamily: "'IBM Plex Mono',monospace",
          fontSize: 11, color: theme.text, outline: 'none', opacity: disabled ? 0.5 : 1,
          boxSizing: 'border-box' }}
      />
    </div>
  )
}
