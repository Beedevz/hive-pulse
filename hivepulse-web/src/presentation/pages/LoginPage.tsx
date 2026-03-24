import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { colors } from '../../shared/colors'
import { HivePulseLogo } from '../components/Logo'
import { useLogin } from '../../application/useAuth'

const FEATURES = [
  'HTTP, TCP, Ping & DNS monitors',
  'Real-time incident alerts',
  'Uptime history & response trends',
  'Team access with role management',
]

export const LoginPage = () => {
  const navigate = useNavigate()
  const login = useLogin()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    try {
      await login.mutateAsync({ email, password })
      navigate('/dashboard')
    } catch {
      setError('Invalid email or password')
    }
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>

      {/* Left panel — branding */}
      <Box
        sx={{
          display: { xs: 'none', lg: 'flex' },
          flexDirection: 'column',
          justifyContent: 'space-between',
          width: '50%',
          p: 6,
          bgcolor: (theme) => theme.palette.mode === 'dark' ? colors.darkSidebar : colors.lightSidebar,
          borderRight: '1px solid',
          borderColor: 'divider',
        }}
      >
        {/* Logo */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <HivePulseLogo size={40} />
          <Typography fontWeight={700} fontSize={20} letterSpacing="-0.02em" sx={{ color: 'text.primary' }}>
            Hive<Box component="span" sx={{ color: 'primary.main' }}>Pulse</Box>
          </Typography>
        </Box>

        {/* Headline + features */}
        <Box>
          <Typography variant="h4" fontWeight={700} color="text.primary" sx={{ mb: 1.5, lineHeight: 1.2, fontSize: '1.75rem' }}>
            Monitor everything.<br />Get notified instantly.
          </Typography>
          <Typography color="text.secondary" fontSize="0.9375rem" sx={{ mb: 5 }}>
            Real-time uptime monitoring for HTTP, TCP, Ping, and DNS services.
          </Typography>
          <Stack spacing={2}>
            {FEATURES.map((f) => (
              <Box key={f} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <CheckCircleIcon sx={{ fontSize: 16, color: 'primary.main', flexShrink: 0 }} />
                <Typography fontSize="0.9rem" color="text.secondary">{f}</Typography>
              </Box>
            ))}
          </Stack>
        </Box>

        <Typography fontSize="0.8125rem" color="#4b5563">
          © {new Date().getFullYear()} HivePulse
        </Typography>
      </Box>

      {/* Right panel — form */}
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4 }}>
        <Box sx={{ width: '100%', maxWidth: 400 }}>

          {/* Mobile logo */}
          <Box sx={{ display: { xs: 'flex', lg: 'none' }, alignItems: 'center', gap: 1.5, mb: 5 }}>
            <HivePulseLogo size={32} />
            <Typography fontWeight={700} fontSize={16} sx={{ color: 'text.primary' }}>
              Hive<Box component="span" sx={{ color: 'primary.main' }}>Pulse</Box>
            </Typography>
          </Box>

          <Typography variant="h5" fontWeight={700} color="text.primary" sx={{ mb: 0.5 }}>
            Sign in
          </Typography>
          <Typography color="text.secondary" fontSize="0.9rem" sx={{ mb: 4 }}>
            Enter your credentials to continue.
          </Typography>

          <form onSubmit={handleSubmit}>
            <Stack spacing={2.5}>
              <TextField
                id="email"
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                fullWidth
                required
              />
              <TextField
                id="password"
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                fullWidth
                required
              />
              {error && (
                <Typography color="error" fontSize="0.8125rem">{error}</Typography>
              )}
              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={login.isPending}
                sx={{ mt: 0.5 }}
              >
                {login.isPending ? 'Signing in…' : 'Sign in'}
              </Button>
            </Stack>
          </form>
        </Box>
      </Box>
    </Box>
  )
}
