import { create } from 'zustand'

export type ThemeMode = 'dark' | 'void' | 'light'

interface ThemeStore {
  mode: ThemeMode
  toggle: () => void
}

const CYCLE: ThemeMode[] = ['dark', 'void', 'light']

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
      const next = CYCLE[(CYCLE.indexOf(s.mode) + 1) % CYCLE.length]
      try { localStorage.setItem('hivepulse-theme', next) } catch { /* ignore */ }
      return { mode: next }
    }),
}))
