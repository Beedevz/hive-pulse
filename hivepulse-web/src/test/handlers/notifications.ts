import { http, HttpResponse } from 'msw'
import type { NotificationChannel } from '../../domain/notification'

const mockChannel: NotificationChannel = {
  id: 'ch-1',
  name: 'Ops Email',
  type: 'email',
  config: { to: 'ops@example.com' },
  is_global: true,
  enabled: true,
  remind_interval_min: 0,
  created_at: '2026-03-25T00:00:00Z',
}

export const notificationHandlers = [
  http.get('http://localhost:8080/api/v1/notification-channels', () =>
    HttpResponse.json({ data: [mockChannel] })
  ),
  http.post('http://localhost:8080/api/v1/notification-channels', () =>
    HttpResponse.json(mockChannel, { status: 201 })
  ),
  http.put('http://localhost:8080/api/v1/notification-channels/:id', () =>
    HttpResponse.json({ message: 'channel updated' })
  ),
  http.delete('http://localhost:8080/api/v1/notification-channels/:id', () =>
    new HttpResponse(null, { status: 204 })
  ),
  http.get('http://localhost:8080/api/v1/notification-channels/:id/logs', ({ params }) => {
    if (params.id === 'ch-empty') return HttpResponse.json({ data: [] })
    return HttpResponse.json({
      data: [
        {
          id: 1,
          channel_id: 'ch-1',
          monitor_id: 'monitor-1',
          monitor_name: 'Test API',
          event: 'down',
          status: 'sent',
          error_msg: '',
          sent_at: new Date(Date.now() - 7_200_000).toISOString(),
        },
        {
          id: 2,
          channel_id: 'ch-1',
          monitor_id: 'monitor-2',
          monitor_name: '',
          event: 'down',
          status: 'failed',
          error_msg: 'dial tcp: connection refused',
          sent_at: new Date(Date.now() - 18_000_000).toISOString(),
        },
      ],
    })
  }),
  http.get('http://localhost:8080/api/v1/monitors/:id/channels', () =>
    HttpResponse.json({
      data: [
        {
          id: 'ch-1',
          name: 'Ops Email',
          type: 'email',
          triggers: { cooldown_minutes: 0 },
        },
      ],
    })
  ),
  http.post('http://localhost:8080/api/v1/monitors/:id/channels/:chID', () =>
    new HttpResponse(null, { status: 201 })
  ),
  http.delete('http://localhost:8080/api/v1/monitors/:id/channels/:chID', () =>
    new HttpResponse(null, { status: 204 })
  ),
  http.post('http://localhost:8080/api/v1/notification-channels/:id/test', () =>
    HttpResponse.json({ message: 'test notification sent' })
  ),
  http.get('http://localhost:8080/api/v1/settings/smtp', () =>
    HttpResponse.json({ host: '', port: 587, user: '', password: '', from: '' })
  ),
  http.put('http://localhost:8080/api/v1/settings/smtp', () =>
    HttpResponse.json({ message: 'smtp settings updated' })
  ),
  http.put('http://localhost:8080/api/v1/monitors/:id/channels/:channelId/triggers', () =>
    HttpResponse.json({ message: 'triggers updated' })
  ),
  http.get('http://localhost:8080/api/v1/settings/general', () =>
    HttpResponse.json({ timezone: 'UTC' })
  ),
  http.put('http://localhost:8080/api/v1/settings/general', () =>
    HttpResponse.json({ message: 'general settings updated' })
  ),
]
