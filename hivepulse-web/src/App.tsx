import { useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useSetupStatus, useInitAuth } from './application/useAuth'
import { LoginPage } from './presentation/pages/LoginPage'
import { SetupPage } from './presentation/pages/SetupPage'
import { DashboardPage } from './presentation/pages/DashboardPage'
import { SettingsPage } from './presentation/pages/SettingsPage'
import { AlertsPage } from './presentation/pages/AlertsPage'
import { MonitorDetailPage } from './presentation/pages/MonitorDetailPage'
import { PrivateRoute } from './presentation/components/PrivateRoute'

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
  useInitAuth()
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/setup" element={<SetupPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
      <Route path="/settings" element={<PrivateRoute><SettingsPage /></PrivateRoute>} />
      <Route path="/alerts" element={<PrivateRoute><AlertsPage /></PrivateRoute>} />
      <Route path="/monitors/:id" element={<PrivateRoute><MonitorDetailPage /></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
