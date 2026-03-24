import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import { Activity } from 'lucide-react'
import { useSetup } from '../../application/useAuth'

export const SetupPage = () => {
  const navigate = useNavigate()
  const setup = useSetup()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    try {
      await setup.mutateAsync({ name, email, password })
      navigate('/login')
    } catch {
      setError('Setup failed. Please try again.')
    }
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', p: 3 }}>
      <Box
        sx={{
          width: '100%', maxWidth: 400,
          bgcolor: 'background.paper',
          border: '1px solid', borderColor: 'divider',
          borderRadius: 3,
          p: 4,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
          <Box sx={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 1.5, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            <Activity size={18} color="white" />
          </Box>
          <Typography fontWeight={700} fontSize={17} color="text.primary" letterSpacing="-0.01em">
            HivePulse
          </Typography>
        </Box>

        <Typography variant="h6" fontWeight={700} color="text.primary" sx={{ mb: 0.5 }}>
          Initial Setup
        </Typography>
        <Typography color="text.secondary" fontSize="0.875rem" sx={{ mb: 3.5 }}>
          Create your admin account to get started.
        </Typography>

        <form onSubmit={handleSubmit}>
          <Stack spacing={2.5}>
            <TextField
              id="name"
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              fullWidth
              required
            />
            <TextField
              id="email"
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              fullWidth
              required
            />
            <TextField
              id="password"
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 8 characters"
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
              disabled={setup.isPending}
            >
              {setup.isPending ? 'Creating…' : 'Create Admin'}
            </Button>
          </Stack>
        </form>
      </Box>
    </Box>
  )
}
