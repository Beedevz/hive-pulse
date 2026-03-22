import { useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useSetupStatus } from './application/useAuth'
import { LoginPage } from './presentation/pages/LoginPage'
import { SetupPage } from './presentation/pages/SetupPage'

function RootRedirect() {
  const { data, isLoading } = useSetupStatus()
  const navigate = useNavigate()

  useEffect(() => {
    if (isLoading) return
    if (data?.setup_required) navigate('/setup', { replace: true })
    else navigate('/login', { replace: true })
  }, [data, isLoading, navigate])

  return null
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/setup" element={<SetupPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/dashboard" element={<div>Dashboard — coming in Slice 4</div>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
