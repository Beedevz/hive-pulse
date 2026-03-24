import { create } from 'zustand'

type ThemeMode = 'dark' | 'light'

interface ThemeStore {
  mode: ThemeMode
  toggle: () => void
}

function stored(): ThemeMode {
  try {
    return (localStorage.getItem('hivepulse-theme') as ThemeMode) ?? 'dark'
  } catch {
    return 'dark'
  }
}

export const useThemeMode = create<ThemeStore>((set) => ({
  mode: stored(),
  toggle: () =>
    set((s) => {
      const next: ThemeMode = s.mode === 'dark' ? 'light' : 'dark'
      try { localStorage.setItem('hivepulse-theme', next) } catch { /* ignore */ }
      return { mode: next }
    }),
}))
