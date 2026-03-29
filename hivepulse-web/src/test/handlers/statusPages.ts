import { http, HttpResponse } from 'msw'
import type { StatusPage, PublicStatusPageData } from '../../domain/statusPage'

const mockStatusPage: StatusPage = {
  id: 'sp-1', slug: 'my-company-a3f2', title: 'My Company Status',
  description: 'Real-time status', logo_url: null, accent_color: '#F5A623',
  custom_domain: null, tag_ids: ['tag-1'], created_at: '2026-03-25T00:00:00Z',
}

const mockPublicData: PublicStatusPageData = {
  title: 'My Company Status', description: 'Real-time status',
  accent_color: '#F5A623', logo_url: null, overall_status: 'operational',
  monitors: [{
    id: 'monitor-1', name: 'API Gateway', check_type: 'http',
    last_status: 'up', uptime_24h: 0.998, uptime_90d: 0.994,
    daily_buckets: Array.from({ length: 90 }, (_, i) => ({
      date: new Date(Date.now() - i * 86400000).toISOString().slice(0, 10),
      uptime_pct: 1.0,
    })),
  }],
  active_incidents: [],
  recent_incidents: [],
}

export const statusPageHandlers = [
  http.get('http://localhost:8080/api/v1/status-pages', () =>
    HttpResponse.json({ data: [mockStatusPage], total: 1, page: 1, limit: 20 })
  ),
  http.get('http://localhost:8080/api/v1/status-pages/:id', () =>
    HttpResponse.json(mockStatusPage)
  ),
  http.post('http://localhost:8080/api/v1/status-pages', () =>
    HttpResponse.json({ ...mockStatusPage, id: 'sp-new' }, { status: 201 })
  ),
  http.put('http://localhost:8080/api/v1/status-pages/:id', () =>
    HttpResponse.json(mockStatusPage)
  ),
  http.delete('http://localhost:8080/api/v1/status-pages/:id', () => new HttpResponse(null, { status: 204 })),
  http.get('http://localhost:8080/api/v1/status-pages/public/:slug', () =>
    HttpResponse.json(mockPublicData)
  ),
]
