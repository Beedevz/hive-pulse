import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../../test/msw-server'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useMonitors, useCreateMonitor } from '../useMonitors'
import React from 'react'

const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(
    QueryClientProvider,
    { client: new QueryClient({ defaultOptions: { queries: { retry: false } } }) },
    children
  )

describe('useMonitors', () => {
  it('fetches paginated monitors list', async () => {
    server.use(
      http.get('http://localhost:8080/api/v1/monitors', () =>
        HttpResponse.json({
          data: [{ id: '1', name: 'Test API', check_type: 'http' }],
          total: 1,
          page: 1,
          limit: 20,
        })
      )
    )
    const { result } = renderHook(() => useMonitors(), { wrapper })
    await waitFor(() => expect(result.current.data?.total).toBe(1))
    expect(result.current.data?.data[0]?.name).toBe('Test API')
  })
})

describe('useCreateMonitor', () => {
  it('mutation resolves without error', async () => {
    server.use(
      http.post('http://localhost:8080/api/v1/monitors', () =>
        HttpResponse.json({
          id: 'mon1',
          name: 'New Monitor',
          check_type: 'http',
          interval: 60,
          timeout: 10,
          retries: 3,
          retry_interval: 5,
          enabled: true,
          last_status: 'unknown',
          uptime_24h: 0,
          created_at: '2026-03-23T00:00:00Z',
        })
      )
    )
    const { result } = renderHook(() => useCreateMonitor(), { wrapper })
    const response = await result.current.mutateAsync({
      name: 'New Monitor',
      check_type: 'http',
      interval: 60,
      timeout: 10,
      retries: 3,
      retry_interval: 5,
      enabled: true,
    })
    expect(response?.id).toBe('mon1')
  })
})
