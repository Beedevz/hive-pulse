import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSetup } from '../../application/useAuth'
import { Logo, Wordmark } from '../components/Logo'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { useTheme } from '../../shared/useTheme'

export const SetupPage = () => {
  const { theme } = useTheme()
  const navigate = useNavigate()
  const setup = useSetup()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
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
    <div style={{ minHeight: '100vh', background: theme.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 12,
        padding: '32px 28px', width: 320, boxShadow: theme.shadow }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
          <Logo size={28} />
          <Wordmark size={15} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <div style={{ color: theme.text, fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Initial Setup</div>
          <div style={{ color: theme.text2, fontSize: 11 }}>Create your admin account to get started.</div>
        </div>
        <form onSubmit={handleSubmit}>
          <Input label="Name" value={name} onChange={setName} placeholder="Your name" />
          <Input label="Email" value={email} onChange={setEmail} placeholder="admin@example.com" type="email" />
          <Input label="Password" value={password} onChange={setPassword} placeholder="Min 8 characters" type="password" />
          {error && <div style={{ color: theme.down, fontSize: 11, marginBottom: 8 }}>{error}</div>}
          <Button type="submit" fullWidth disabled={setup.isPending}>
            {setup.isPending ? 'Creating...' : 'Create Admin'}
          </Button>
        </form>
      </div>
    </div>
  )
}
