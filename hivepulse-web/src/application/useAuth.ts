import { useMutation, useQuery } from '@tanstack/react-query'
import { apiClient } from '../infrastructure/apiClient'
import { useAuthStore } from '../shared/authStore'
import type { AuthTokens, LoginRequest, SetupRequest, SetupStatus, User } from '../domain/user'

export const useSetupStatus = () =>
  useQuery<SetupStatus>({
    queryKey: ['setup-status'],
    queryFn: () => apiClient.get('/auth/setup/status').then((r) => r.data),
    staleTime: Infinity,
  })

export const useSetup = () =>
  useMutation({
    mutationFn: (req: SetupRequest) =>
      apiClient.post('/auth/setup', req).then((r) => r.data),
  })

export const useLogin = () => {
  const setToken = useAuthStore((s) => s.setAccessToken)
  return useMutation({
    mutationFn: (req: LoginRequest) =>
      apiClient.post<AuthTokens>('/auth/login', req).then((r) => r.data),
    onSuccess: (data) => setToken(data.access_token),
  })
}

export const useLogout = () => {
  const clear = useAuthStore((s) => s.clearAccessToken)
  return useMutation({
    mutationFn: () => apiClient.post('/auth/logout'),
    onSuccess: () => clear(),
  })
}

export const useMe = () =>
  useQuery<User>({
    queryKey: ['me'],
    queryFn: () => apiClient.get('/auth/me').then((r) => r.data),
    retry: false,
  })
