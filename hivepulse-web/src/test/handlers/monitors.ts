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
  http.get('/api/v1/monitors', () =>
    HttpResponse.json({ data: [mockMonitor], total: 1, page: 1, limit: 20 })
  ),
  http.post('/api/v1/monitors', () =>
    HttpResponse.json({ message: 'monitor created' }, { status: 201 })
  ),
  http.get('/api/v1/monitors/:id', () => HttpResponse.json(mockMonitor)),
  http.put('/api/v1/monitors/:id', () =>
    HttpResponse.json({ message: 'monitor updated' })
  ),
  http.delete('/api/v1/monitors/:id', () => new HttpResponse(null, { status: 204 })),
]
