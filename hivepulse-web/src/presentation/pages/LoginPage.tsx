import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLogin } from '../../application/useAuth'
import { Logo, Wordmark } from '../components/Logo'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { useTheme } from '../../shared/useTheme'

export const LoginPage = () => {
  const { theme } = useTheme()
  const navigate = useNavigate()
  const login = useLogin()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await login.mutateAsync({ email, password })
      navigate('/dashboard')
    } catch {
      setError('Invalid credentials')
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: theme.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 12,
        padding: '32px 28px', width: 320, boxShadow: theme.shadow }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
          <Logo size={28} />
          <Wordmark size={15} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <div style={{ color: theme.text, fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Sign In</div>
          <div style={{ color: theme.text2, fontSize: 11 }}>Enter your credentials to continue.</div>
        </div>
        <form onSubmit={handleSubmit}>
          <Input label="Email" value={email} onChange={setEmail} placeholder="admin@example.com" type="email" />
          <Input label="Password" value={password} onChange={setPassword} placeholder="Your password" type="password" />
          {error && <div style={{ color: theme.down, fontSize: 11, marginBottom: 8 }}>{error}</div>}
          <Button type="submit" fullWidth disabled={login.isPending}>
            {login.isPending ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
      </div>
    </div>
  )
}
