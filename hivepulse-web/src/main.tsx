import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { darkTheme, voidDarkTheme, lightTheme } from './shared/muiTheme'
import { useThemeMode } from './shared/themeStore'
import App from './App'

const queryClient = new QueryClient()

// eslint-disable-next-line react-refresh/only-export-components
const muiThemeFor = { dark: darkTheme, void: voidDarkTheme, light: lightTheme }

function ThemedApp() {
  const { mode } = useThemeMode()
  return (
    <ThemeProvider theme={muiThemeFor[mode]}>
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
