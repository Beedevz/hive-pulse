// ─── Single source of truth for the HivePulse color scale ───────────────────
// Extracted from the reference mockup (hivepulse-mockup.jsx)

export const colors = {
  // ── Brand / Accent ────────────────────────────────────────────────────────
  // Dark: amber/gold, Light: darker gold (matches mockup TH.ac)
  accentDark:  '#f5a623',
  accentLight: '#c89000',
  accentGlow:  '#f7be5a',  // TH.al

  // ── Status (vivid — dots, sparklines, chip badges, card borders) ──────────
  // UptimeBar blocks use these same colors with opacity:0.4 for "up", 1 for others
  up:   '#4ade80',  // dark theme up
  upL:  '#22c55e',  // light theme up
  down: '#f87171',  // both themes down
  downL:'#ef4444',  // light theme down
  slow: '#fbbf24',  // dark theme slow/degraded
  slowL:'#d97706',  // light theme slow/degraded
  blue: '#6ba3f7',  // maintenance dark
  blueL:'#3574c4',  // maintenance light

  // ── Dark surfaces (warm purple-navy) ─────────────────────────────────────
  darkBg:          '#202232',              // TH.bg
  darkPaper:       '#1e2134',              // TH.sf solid approx (rgba 30,33,52)
  darkSidebar:     '#161626',              // TH.sb solid approx (rgba 22,24,38)
  darkHeader:      '#1c1e2e',              // TH.hd solid approx (rgba 28,30,46)
  darkBorder:      'rgba(140,145,180,0.08)', // TH.bs
  darkBorderHover: 'rgba(245,166,35,0.22)', // TH.bh
  darkInput:       'rgba(35,38,58,0.8)',   // TH.ip
  darkSurface2:    'rgba(35,38,60,0.6)',   // TH.sa (alt surface)

  // ── Light surfaces (warm cream) ───────────────────────────────────────────
  lightBg:          '#f5f3ec',             // TH.bg
  lightPaper:       '#ffffff',             // TH.ss
  lightSidebar:     '#ffffff',
  lightBorder:      'rgba(160,140,80,0.06)', // TH.bs
  lightBorderHover: 'rgba(160,140,80,0.28)', // TH.bh
  lightInput:       'rgba(245,242,234,0.9)', // TH.ip
  lightSurface2:    'rgba(248,246,238,0.7)', // TH.sa

  // ── Text — dark (warm) ────────────────────────────────────────────────────
  darkTextPrimary:   '#f0eddf',  // TH.tx — warm cream white
  darkTextSecondary: '#8e91a8',  // TH.t2
  darkTextTertiary:  '#555872',  // TH.t3

  // ── Text — light (warm) ───────────────────────────────────────────────────
  lightTextPrimary:   '#14170a',  // TH.tx
  lightTextSecondary: '#65604c',  // TH.t2
  lightTextTertiary:  '#9e9882',  // TH.t3
} as const
