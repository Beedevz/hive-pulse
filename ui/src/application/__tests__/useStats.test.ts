import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../../test/msw-server'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useStats } from '../useStats'
import React from 'react'

const createWrapper = () => {
  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(
      QueryClientProvider,
      { client: new QueryClient({ defaultOptions: { queries: { retry: false } } }) },
      children
    )
  return wrapper
}

describe('useStats', () => {
  it('useStats returns stats data', async () => {
    server.use(
      http.get('http://localhost:8080/api/v1/monitors/monitor-1/stats', () =>
        HttpResponse.json({
          uptime_pct: 99.5,
          avg_ping_ms: 42.1,
          buckets: [
            { time: '2026-03-24T00:00:00Z', up_count: 59, total_count: 60, avg_ping_ms: 41.0 },
            { time: '2026-03-24T01:00:00Z', up_count: 60, total_count: 60, avg_ping_ms: 43.2 },
          ],
        })
      )
    )
    const { result } = renderHook(() => useStats('monitor-1', '24h'), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.uptime_pct).toBe(99.5)
    expect(result.current.data?.buckets).toHaveLength(2)
  })
})
