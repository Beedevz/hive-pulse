import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../shared/authStore'

export function PrivateRoute({ children }: Readonly<{ children: ReactNode }>) {
  const token = useAuthStore(s => s.accessToken)
  const hydrated = useAuthStore(s => s.hydrated)
  if (!hydrated) return null
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}
