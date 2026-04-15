import { describe, it, expect } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../../test/msw-server'

describe('apiClient silent refresh', () => {
  it('retries original request after 401 triggers refresh', async () => {
    let attempts = 0

    server.use(
      http.get('http://localhost:8080/api/v1/auth/me', () => {
        attempts++
        if (attempts === 1) return new HttpResponse(null, { status: 401 })
        return HttpResponse.json({ id: '1', email: 'a@b.com', name: 'A', role: 'admin' })
      }),
      http.post('http://localhost:8080/api/v1/auth/refresh', () =>
        HttpResponse.json({ access_token: 'new-token' })
      ),
    )

    const { apiClient } = await import('../apiClient')
    const res = await apiClient.get('/auth/me')
    expect(res.data.email).toBe('a@b.com')
    expect(attempts).toBe(2)
  })
})
