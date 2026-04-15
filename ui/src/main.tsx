import { StrictMode, useMemo } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { createAppTheme } from './shared/muiTheme'
import { useThemeMode } from './shared/themeStore'
import { useFontStore } from './shared/fontStore'
import App from './App'

const queryClient = new QueryClient()

// eslint-disable-next-line react-refresh/only-export-components
function ThemedApp() {
  const { mode } = useThemeMode()
  const { fontPair } = useFontStore()
  const theme = useMemo(() => createAppTheme(mode, fontPair), [mode, fontPair])
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ThemedApp />
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>
)
