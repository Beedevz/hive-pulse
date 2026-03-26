export const themes = {
  dark: {
    bg: '#202232', surface: 'rgba(30,33,52,0.75)', text: '#f0eddf',
    text2: '#8e91a8', text3: '#555872', accent: '#f5a623', accentLight: '#f7be5a',
    accentBg: 'rgba(245,166,35,0.07)', accentBorder: 'rgba(245,166,35,0.18)',
    border: 'rgba(140,145,180,0.08)', up: '#4ade80', down: '#f87171',
    degraded: '#fbbf24', maintenance: '#6ba3f7',
    input: 'rgba(35,38,58,0.8)', shadow: '0 2px 16px rgba(0,0,0,0.35)',
  },
  void: {
    bg: '#0A0A0F', surface: '#16161F', text: '#E8E6E1',
    text2: '#8A8690', text3: '#5A5660', accent: '#F0A500', accentLight: '#FFC233',
    accentBg: 'rgba(240,165,0,0.08)', accentBorder: 'rgba(240,165,0,0.20)',
    border: 'rgba(255,255,255,0.06)', up: '#34D399', down: '#f87171',
    degraded: '#fbbf24', maintenance: '#6ba3f7',
    input: '#1C1C28', shadow: '0 2px 24px rgba(0,0,0,0.60)',
  },
  light: {
    bg: '#f5f3ec', surface: 'rgba(255,255,255,0.88)', text: '#14170a',
    text2: '#65604c', text3: '#9e9882', accent: '#c89000', accentLight: '#daa520',
    accentBg: 'rgba(200,144,0,0.06)', accentBorder: 'rgba(200,144,0,0.18)',
    border: 'rgba(160,140,80,0.06)', up: '#22c55e', down: '#ef4444',
    degraded: '#d97706', maintenance: '#3574c4',
    input: 'rgba(245,242,234,0.9)', shadow: '0 2px 12px rgba(100,80,30,0.06)',
  },
} as const

export type ThemeName = keyof typeof themes
export type Theme = typeof themes[ThemeName]
