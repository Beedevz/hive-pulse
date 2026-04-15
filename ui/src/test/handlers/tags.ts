import { http, HttpResponse } from 'msw'
import type { Tag } from '../../domain/tag'

const mockTag: Tag = { id: 'tag-1', name: 'Production', color: '#4ADE80', created_at: '2026-03-25T00:00:00Z' }

export const tagHandlers = [
  http.get('http://localhost:8080/api/v1/tags', () =>
    HttpResponse.json({ data: [mockTag] })
  ),
  http.post('http://localhost:8080/api/v1/tags', () =>
    HttpResponse.json({ ...mockTag, id: 'tag-new' }, { status: 201 })
  ),
  http.delete('http://localhost:8080/api/v1/tags/:id', () => new HttpResponse(null, { status: 204 })),
  http.get('http://localhost:8080/api/v1/monitors/:id/tags', () =>
    HttpResponse.json({ data: [mockTag] })
  ),
  http.post('http://localhost:8080/api/v1/monitors/:id/tags/:tagId', () => new HttpResponse(null, { status: 204 })),
  http.delete('http://localhost:8080/api/v1/monitors/:id/tags/:tagId', () => new HttpResponse(null, { status: 204 })),
]
