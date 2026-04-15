import { create } from 'zustand'

export type FontPair = 'hivepulse' | 'beedevz'

export const fontPairMeta: Record<FontPair, { label: string; heading: string; body: string }> = {
  hivepulse: {
    label: 'HivePulse (Bricolage Grotesque + IBM Plex Mono)',
    heading: '"Bricolage Grotesque", sans-serif',
    body:    '"IBM Plex Mono", monospace',
  },
  beedevz: {
    label: 'Beedevz (Outfit + JetBrains Mono)',
    heading: '"Outfit", sans-serif',
    body:    '"JetBrains Mono", monospace',
  },
}

interface FontStore {
  fontPair: FontPair
  setFontPair: (pair: FontPair) => void
}

function stored(): FontPair {
  try {
    return (localStorage.getItem('hivepulse-font') as FontPair) ?? 'hivepulse'
  } catch {
    return 'hivepulse'
  }
}

export const useFontStore = create<FontStore>((set) => ({
  fontPair: stored(),
  setFontPair: (pair) => {
    try { localStorage.setItem('hivepulse-font', pair) } catch { /* ignore */ }
    set({ fontPair: pair })
  },
}))
