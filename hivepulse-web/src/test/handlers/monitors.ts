import { http, HttpResponse } from 'msw'
import type { Monitor } from '../../domain/monitor'
import type { Incident } from '../../domain/incident'

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
  http.get('http://localhost:8080/api/v1/incidents', ({ request }) => {
    const url = new URL(request.url)
    const status = url.searchParams.get('status') ?? 'all'

    const activeIncident: Incident = {
      id: 1,
      monitor_id: 'monitor-1',
      monitor_name: 'Test API',
      started_at: new Date(Date.now() - 120_000).toISOString(),
      resolved_at: null,
      duration_s: 120,
      error_msg: 'connection refused',
    }
    const resolvedIncident1: Incident = {
      id: 2,
      monitor_id: 'monitor-1',
      monitor_name: 'Test API',
      started_at: new Date(Date.now() - 3_600_000).toISOString(),
      resolved_at: new Date(Date.now() - 3_400_000).toISOString(),
      duration_s: 200,
      error_msg: 'timeout',
    }
    const resolvedIncident2: Incident = {
      id: 3,
      monitor_id: 'monitor-1',
      monitor_name: 'Test API',
      started_at: new Date(Date.now() - 7_200_000).toISOString(),
      resolved_at: new Date(Date.now() - 7_000_000).toISOString(),
      duration_s: 200,
      error_msg: '503 Service Unavailable',
    }

    if (status === 'active') {
      return HttpResponse.json({ data: [activeIncident], total: 1 })
    }
    if (status === 'resolved') {
      return HttpResponse.json({ data: [resolvedIncident1, resolvedIncident2], total: 2 })
    }
    return HttpResponse.json({
      data: [activeIncident, resolvedIncident1, resolvedIncident2],
      total: 3,
    })
  }),
]
