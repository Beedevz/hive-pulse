import { createTheme } from '@mui/material/styles'
import { colors } from './colors'

// ─── shared component overrides ──────────────────────────────────────────────

const sharedComponents = {
  MuiButton: {
    styleOverrides: {
      root: {
        textTransform: 'none' as const,
        fontWeight: 600,
        boxShadow: 'none',
        '&:hover': { boxShadow: 'none' },
      },
    },
  },
  MuiTableCell: {
    styleOverrides: {
      root: { fontSize: '0.875rem' },
      head: {
        fontWeight: 600,
        fontSize: '0.75rem',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.05em',
      },
    },
  },
  MuiSelect: {
    styleOverrides: { icon: { color: colors.darkTextTertiary } },
  },
  MuiMenuItem: {
    styleOverrides: { root: { fontSize: '0.875rem' } },
  },
  MuiChip: {
    styleOverrides: { root: { fontWeight: 600 } },
  },
}

const cssBaselineOverrides = {
  '*, *::before, *::after': { boxSizing: 'border-box' },
  body: { margin: 0 },
  '#root': { minHeight: '100vh' }, // extended per-theme with hex pattern
  '@keyframes shake': {
    '0%,100%': { transform: 'translateX(0)' },
    '20%':     { transform: 'translateX(-4px)' },
    '40%':     { transform: 'translateX(4px)' },
    '60%':     { transform: 'translateX(-3px)' },
    '80%':     { transform: 'translateX(3px)' },
  },
}

// ─── honeycomb background patterns ───────────────────────────────────────────

// Flat-top hexagon honeycomb tile, R=60 → tile 180×104
// Hex1 center at (60,52): TL(30,0) TR(90,0) Right(120,52) BR(90,104) BL(30,104) Left(0,52)
// Mid segment closes the right cell shared with the adjacent tile

// ─── dark theme ───────────────────────────────────────────────────────────────

export const darkTheme = createTheme({
  palette: {
    mode: 'dark' as const,
    primary:  { main: colors.accentDark, dark: '#d4900e', light: colors.accentGlow },
    error:    { main: colors.down },
    success:  { main: colors.up },
    warning:  { main: colors.slow },
    info:     { main: colors.blue },
    background: {
      default: colors.darkBg,
      paper:   colors.darkPaper,
    },
    text: {
      primary:   colors.darkTextPrimary,
      secondary: colors.darkTextSecondary,
    },
    divider: colors.darkBorder,
  },
  typography: {
    fontFamily: '"IBM Plex Mono", monospace',
    fontSize: 14,
    h1: { fontFamily: '"Bricolage Grotesque", sans-serif' },
    h2: { fontFamily: '"Bricolage Grotesque", sans-serif' },
    h3: { fontFamily: '"Bricolage Grotesque", sans-serif' },
    h4: { fontFamily: '"Bricolage Grotesque", sans-serif' },
    h5: { fontFamily: '"Bricolage Grotesque", sans-serif' },
    h6: { fontFamily: '"Bricolage Grotesque", sans-serif' },
  },
  shape: { borderRadius: 8 },
  components: {
    ...sharedComponents,
    MuiCssBaseline: {
      styleOverrides: {
        ...cssBaselineOverrides,
        '#root': {
          minHeight: '100vh',
          backgroundRepeat: 'repeat',
          backgroundAttachment: 'fixed',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backdropFilter: 'blur(8px)',
          backgroundImage: 'none',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: colors.darkInput,
          '& .MuiOutlinedInput-notchedOutline': { borderColor: colors.darkBorder },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: colors.darkBorderHover },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: colors.accentDark },
        },
        input: {
          fontSize: '0.875rem',
          '&::placeholder': { color: colors.darkTextTertiary, opacity: 1 },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontSize: '0.875rem',
          color: colors.darkTextSecondary,
          '&.Mui-focused': { color: colors.accentDark },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: colors.darkPaper,
          backgroundImage: 'none',
          border: `1px solid ${colors.darkBorderHover}`,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderColor: colors.darkBorder, fontSize: '0.875rem' },
        head: {
          color: colors.darkTextTertiary,
          fontWeight: 600,
          fontSize: '0.75rem',
          textTransform: 'uppercase' as const,
          letterSpacing: '0.05em',
        },
      },
    },
  },
})

// ─── void dark theme (Beedevz design system) ──────────────────────────────────

export const voidDarkTheme = createTheme({
  palette: {
    mode: 'dark' as const,
    primary:  { main: colors.voidAccent, dark: colors.voidAccentDim, light: colors.voidAccentLight },
    error:    { main: colors.down },
    success:  { main: '#34D399' },
    warning:  { main: colors.slow },
    info:     { main: colors.blue },
    background: {
      default: colors.voidBg,
      paper:   colors.voidPaper,
    },
    text: {
      primary:   colors.voidTextPrimary,
      secondary: colors.voidTextSecondary,
    },
    divider: colors.voidBorder,
  },
  typography: {
    fontFamily: '"IBM Plex Mono", monospace',
    fontSize: 14,
    h1: { fontFamily: '"Bricolage Grotesque", sans-serif' },
    h2: { fontFamily: '"Bricolage Grotesque", sans-serif' },
    h3: { fontFamily: '"Bricolage Grotesque", sans-serif' },
    h4: { fontFamily: '"Bricolage Grotesque", sans-serif' },
    h5: { fontFamily: '"Bricolage Grotesque", sans-serif' },
    h6: { fontFamily: '"Bricolage Grotesque", sans-serif' },
  },
  shape: { borderRadius: 8 },
  components: {
    ...sharedComponents,
    MuiCssBaseline: {
      styleOverrides: {
        ...cssBaselineOverrides,
        '#root': {
          minHeight: '100vh',
          backgroundRepeat: 'repeat',
          backgroundAttachment: 'fixed',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          boxShadow: '0 2px 24px rgba(0,0,0,0.60)',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: colors.voidInput,
          '& .MuiOutlinedInput-notchedOutline': { borderColor: colors.voidBorder },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: colors.voidBorderHover },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: colors.voidAccent },
        },
        input: {
          fontSize: '0.875rem',
          '&::placeholder': { color: colors.voidTextTertiary, opacity: 1 },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontSize: '0.875rem',
          color: colors.voidTextSecondary,
          '&.Mui-focused': { color: colors.voidAccent },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: colors.voidPaper,
          backgroundImage: 'none',
          border: `1px solid ${colors.voidBorderHover}`,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderColor: colors.voidBorder, fontSize: '0.875rem' },
        head: {
          color: colors.voidTextTertiary,
          fontWeight: 600,
          fontSize: '0.75rem',
          textTransform: 'uppercase' as const,
          letterSpacing: '0.05em',
        },
      },
    },
  },
})

// ─── light theme ──────────────────────────────────────────────────────────────

export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary:  { main: colors.accentLight, dark: '#a07500', light: colors.accentGlow },
    error:    { main: colors.downL },
    success:  { main: colors.upL },
    warning:  { main: colors.slowL },
    info:     { main: colors.blueL },
    background: {
      default: colors.lightBg,
      paper:   colors.lightPaper,
    },
    text: {
      primary:   colors.lightTextPrimary,
      secondary: colors.lightTextSecondary,
    },
    divider: colors.lightBorder,
  },
  typography: {
    fontFamily: '"IBM Plex Mono", monospace',
    fontSize: 14,
    h1: { fontFamily: '"Bricolage Grotesque", sans-serif' },
    h2: { fontFamily: '"Bricolage Grotesque", sans-serif' },
    h3: { fontFamily: '"Bricolage Grotesque", sans-serif' },
    h4: { fontFamily: '"Bricolage Grotesque", sans-serif' },
    h5: { fontFamily: '"Bricolage Grotesque", sans-serif' },
    h6: { fontFamily: '"Bricolage Grotesque", sans-serif' },
  },
  shape: { borderRadius: 8 },
  components: {
    ...sharedComponents,
    MuiCssBaseline: {
      styleOverrides: {
        ...cssBaselineOverrides,
        '#root': {
          minHeight: '100vh',
          backgroundRepeat: 'repeat',
          backgroundAttachment: 'fixed',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: colors.lightInput,
          '& .MuiOutlinedInput-notchedOutline': { borderColor: colors.lightBorder },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: colors.lightBorderHover },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: colors.accentLight },
        },
        input: { fontSize: '0.875rem' },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontSize: '0.875rem',
          '&.Mui-focused': { color: colors.accentLight },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: colors.lightPaper,
          backgroundImage: 'none',
          border: `1px solid ${colors.lightBorderHover}`,
          boxShadow: '0 20px 60px rgba(100,80,30,0.12)',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderColor: colors.lightBorder, fontSize: '0.875rem' },
        head: {
          color: colors.lightTextTertiary,
          fontWeight: 600,
          fontSize: '0.75rem',
          textTransform: 'uppercase' as const,
          letterSpacing: '0.05em',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { boxShadow: '0 2px 12px rgba(100,80,30,0.06)' },
      },
    },
  },
})

// legacy default export (keeps existing imports working)
export const muiTheme = darkTheme
