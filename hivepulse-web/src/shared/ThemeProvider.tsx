import { createContext, useContext, useState } from 'react'
import { themes, type Theme, type ThemeName } from './theme'

interface ThemeContextValue { theme: Theme; name: ThemeName; toggle: () => void }

// eslint-disable-next-line react-refresh/only-export-components
export const ThemeContext = createContext<ThemeContextValue>(null!)

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [name, setName] = useState<ThemeName>(() => {
    try {
      return (localStorage.getItem('theme') as ThemeName) ?? 'dark'
    } catch {
      return 'dark'
    }
  })
  const toggle = () => setName((n) => {
    const next = n === 'dark' ? 'light' : 'dark'
    try { localStorage.setItem('theme', next) } catch { /* ignore in restricted environments */ }
    return next
  })
  return (
    <ThemeContext.Provider value={{ theme: themes[name], name, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useThemeContext = () => useContext(ThemeContext)
