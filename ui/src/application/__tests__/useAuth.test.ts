import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../../test/msw-server'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useSetupStatus, useLogin } from '../useAuth'
import React from 'react'

const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(
    QueryClientProvider,
    { client: new QueryClient({ defaultOptions: { queries: { retry: false } } }) },
    children
  )

describe('useSetupStatus', () => {
  it('returns setup_required true when no users exist', async () => {
    server.use(
      http.get('http://localhost:8080/api/v1/auth/setup/status', () =>
        HttpResponse.json({ setup_required: true })
      )
    )
    const { result } = renderHook(() => useSetupStatus(), { wrapper })
    await waitFor(() => expect(result.current.data?.setup_required).toBe(true))
  })
})

describe('useLogin', () => {
  it('stores access token on success', async () => {
    server.use(
      http.post('http://localhost:8080/api/v1/auth/login', () =>
        HttpResponse.json({ access_token: 'tok123' })
      )
    )
    const { result } = renderHook(() => useLogin(), { wrapper })
    await result.current.mutateAsync({ email: 'a@b.com', password: 'pass' })
    const { useAuthStore } = await import('../../shared/authStore')
    expect(useAuthStore.getState().accessToken).toBe('tok123')
  })
})
