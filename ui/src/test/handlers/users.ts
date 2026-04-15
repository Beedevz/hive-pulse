import { http, HttpResponse } from 'msw'

const mockUser = {
  id: 'user-1',
  name: 'Admin',
  email: 'admin@example.com',
  role: 'admin',
  created_at: '2026-03-22T00:00:00Z',
}

export const userHandlers = [
  http.get('/api/v1/users', () =>
    HttpResponse.json({ data: [mockUser], total: 1, page: 1, limit: 20 })
  ),
  http.put('/api/v1/users/:id/role', () =>
    HttpResponse.json({ message: 'role updated' })
  ),
  http.delete('/api/v1/users/:id', () => new HttpResponse(null, { status: 204 })),
]
