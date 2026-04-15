import { http, HttpResponse } from 'msw'
import type { Monitor } from '../../domain/monitor'

const mockMonitor: Monitor = {
  id: 'monitor-1',
  name: 'Test API',
  check_type: 'http',
  interval: 60,
  timeout: 30,
  retries: 0,
  retry_interval: 20,
  enabled: true,
  url: 'https://example.com',
  method: 'GET',
  expected_status: 200,
  follow_redirects: true,
  last_status: 'unknown',
  uptime_24h: 0,
  created_at: '2026-03-22T00:00:00Z',
}

export const monitorHandlers = [
  http.get('http://localhost:8080/api/v1/monitors', () =>
    HttpResponse.json({ data: [mockMonitor], total: 1, page: 1, limit: 20 })
  ),
  http.post('http://localhost:8080/api/v1/monitors', () =>
    HttpResponse.json({ message: 'monitor created' }, { status: 201 })
  ),
  http.get('http://localhost:8080/api/v1/monitors/:id', () => HttpResponse.json(mockMonitor)),
  http.put('http://localhost:8080/api/v1/monitors/:id', () =>
    HttpResponse.json({ message: 'monitor updated' })
  ),
  http.delete('http://localhost:8080/api/v1/monitors/:id', () => new HttpResponse(null, { status: 204 })),
  http.get('http://localhost:8080/api/v1/monitors/:id/stats', () =>
    HttpResponse.json({
      uptime_pct: 97.5,
      avg_ping_ms: 42,
      buckets: [
        { time: new Date(Date.now() - 3_600_000).toISOString(), up_count: 1, total_count: 1, avg_ping_ms: 40 },
        { time: new Date(Date.now() - 1_800_000).toISOString(), up_count: 1, total_count: 1, avg_ping_ms: 44 },
      ],
      down_periods: [
        {
          started_at: new Date(Date.now() - 3_000_000).toISOString(),
          resolved_at: new Date(Date.now() - 2_700_000).toISOString(),
        },
      ],
    })
  ),
  http.get('http://localhost:8080/api/v1/monitors/:id/heartbeats', () => {
    return HttpResponse.json({
      data: Array.from({ length: 48 }, (_, i) => ({
        status: i % 5 === 0 ? 'down' : 'up',
        ping_ms: 40 + i,
        checked_at: new Date(Date.now() - i * 60000).toISOString(),
      })),
    })
  }),
  http.get('http://localhost:8080/api/v1/stats/overview', () =>
    HttpResponse.json({
      avg_ping_ms: 85,
      buckets: Array.from({ length: 12 }, (_, i) => ({
        time: new Date(Date.now() - (11 - i) * 3_600_000).toISOString(),
        up_count: 10,
        total_count: 10,
        avg_ping_ms: 60 + i * 5,
      })),
    })
  ),
]
