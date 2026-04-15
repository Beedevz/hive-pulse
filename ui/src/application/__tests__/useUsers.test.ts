import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../../test/msw-server'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useUsers, useUpdateUserRole, useDeleteUser } from '../useUsers'
import React from 'react'

const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(
    QueryClientProvider,
    { client: new QueryClient({ defaultOptions: { queries: { retry: false } } }) },
    children
  )

describe('useUsers', () => {
  it('fetches paginated users list', async () => {
    server.use(
      http.get('http://localhost:8080/api/v1/users', () =>
        HttpResponse.json({
          data: [{ id: '1', email: 'admin@test.com', name: 'Admin', role: 'admin' }],
          total: 1,
          page: 1,
          limit: 20,
        })
      )
    )
    const { result } = renderHook(() => useUsers(), { wrapper })
    await waitFor(() => expect(result.current.data?.total).toBe(1))
    expect(result.current.data?.data[0]?.role).toBe('admin')
  })
})

describe('useUpdateUserRole', () => {
  it('mutation resolves without error', async () => {
    server.use(
      http.put('http://localhost:8080/api/v1/users/:id/role', () =>
        HttpResponse.json({
          id: 'user1',
          email: 'test@test.com',
          name: 'Test User',
          role: 'editor',
        })
      )
    )
    const { result } = renderHook(() => useUpdateUserRole(), { wrapper })
    const response = await result.current.mutateAsync({ id: 'user1', role: 'editor' })
    expect(response?.role).toBe('editor')
  })
})

describe('useDeleteUser', () => {
  it('mutation resolves without error', async () => {
    server.use(
      http.delete('http://localhost:8080/api/v1/users/:id', () =>
        HttpResponse.json({})
      )
    )
    const { result } = renderHook(() => useDeleteUser(), { wrapper })
    await expect(result.current.mutateAsync('user1')).resolves.toBeDefined()
  })
})
