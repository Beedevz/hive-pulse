import { useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useSetupStatus, useInitAuth } from './application/useAuth'
import { LoginPage } from './presentation/pages/LoginPage'
import { SetupPage } from './presentation/pages/SetupPage'
import { MonitorsPage } from './presentation/pages/MonitorsPage'
import { AlertsPage } from './presentation/pages/AlertsPage'
import { SettingsPage } from './presentation/pages/SettingsPage'
import { AppLayout } from './presentation/components/AppLayout'
import { DashboardLayout } from './presentation/components/DashboardLayout'
import { PrivateRoute } from './presentation/components/PrivateRoute'
import { StatusPagesPage } from './presentation/pages/StatusPagesPage'
import { PublicStatusPage } from './presentation/pages/PublicStatusPage'

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
      <Route path="/s/:slug" element={<PublicStatusPage />} />
      <Route element={<PrivateRoute><AppLayout /></PrivateRoute>}>
        <Route element={<DashboardLayout />}>
          <Route path="/monitor" element={<MonitorsPage />} />
          <Route path="/monitor/:id" element={<MonitorsPage />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/status-pages" element={<StatusPagesPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
