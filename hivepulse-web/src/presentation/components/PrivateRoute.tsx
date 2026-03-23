import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../shared/authStore'

export function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore(s => s.accessToken)
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}
