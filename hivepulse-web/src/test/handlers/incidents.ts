import { http, HttpResponse } from 'msw'
import type { Incident } from '../../domain/incident'

const activeIncident: Incident = {
  id: 1,
  monitor_id: 'monitor-1',
  monitor_name: 'Test API',
  started_at: new Date(Date.now() - 120_000).toISOString(),
  resolved_at: null,
  duration_s: 120,
  error_msg: 'connection refused',
}

const resolvedIncidents: Incident[] = Array.from({ length: 47 }, (_, i) => ({
  id: i + 2,
  monitor_id: 'monitor-1',
  monitor_name: i % 5 === 0 ? 'DB TCP' : 'Test API',
  started_at: new Date(Date.now() - (i + 1) * 3_600_000).toISOString(),
  resolved_at: new Date(Date.now() - (i + 1) * 3_600_000 + 600_000).toISOString(),
  duration_s: 600,
  error_msg: '',
}))

export const incidentHandlers = [
  http.get('http://localhost:8080/api/v1/incidents', ({ request }) => {
    const url = new URL(request.url)
    const status = url.searchParams.get('status') ?? 'all'
    const q = (url.searchParams.get('q') ?? '').toLowerCase()
    const offset = parseInt(url.searchParams.get('offset') ?? '0', 10)
    const limit = parseInt(url.searchParams.get('limit') ?? '20', 10)

    if (status === 'active') {
      const filtered = q ? [] : [activeIncident]
      return HttpResponse.json({ data: filtered, total: filtered.length })
    }

    if (status === 'resolved') {
      const filtered = q
        ? resolvedIncidents.filter((r) => r.monitor_name.toLowerCase().includes(q))
        : resolvedIncidents
      const page = filtered.slice(offset, offset + limit)
      return HttpResponse.json({ data: page, total: filtered.length })
    }

    // all
    const allItems = [activeIncident, ...resolvedIncidents]
    const page = allItems.slice(offset, offset + limit)
    return HttpResponse.json({ data: page, total: allItems.length })
  }),
]
