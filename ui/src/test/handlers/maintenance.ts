import { http, HttpResponse } from 'msw'
import type { MaintenanceWindow } from '../../domain/maintenance'

const mockWindow: MaintenanceWindow = {
  id: 'mw-1',
  monitor_id: 'monitor-1',
  starts_at: new Date(Date.now() - 3_600_000).toISOString(),
  ends_at: new Date(Date.now() + 3_600_000).toISOString(),
  reason: 'Server upgrade',
  created_at: new Date(Date.now() - 3_600_000).toISOString(),
}

export const maintenanceHandlers = [
  http.get('http://localhost:8080/api/v1/monitors/:id/maintenance', () =>
    HttpResponse.json({ data: [mockWindow] })
  ),
  http.get('http://localhost:8080/api/v1/maintenance-windows', () =>
    HttpResponse.json({ data: [] })
  ),
  http.post('http://localhost:8080/api/v1/maintenance-windows', () =>
    HttpResponse.json(mockWindow, { status: 201 })
  ),
  http.delete('http://localhost:8080/api/v1/maintenance-windows/:id', () =>
    new HttpResponse(null, { status: 204 })
  ),
]
