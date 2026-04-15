import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../shared/authStore'
import { wsClient } from '../infrastructure/wsClient'
import type { PaginatedMonitors, HeartbeatEvent } from '../domain/monitor'

export function useWebSocket() {
  const token = useAuthStore(s => s.accessToken)
  const qc = useQueryClient()

  useEffect(() => {
    if (token) {
      wsClient.connect(token)
    }

    const unsub = wsClient.subscribe((event: HeartbeatEvent) => {
      // Patch all cached monitor list queries
      qc.setQueriesData<PaginatedMonitors>(
        { queryKey: ['monitors'], exact: false },
        (prev) => {
          if (!prev) return prev
          return {
            ...prev,
            data: prev.data.map(m =>
              m.id === event.monitor_id
                ? { ...m, last_status: event.status, last_ping_ms: event.ping_ms }
                : m
            ),
          }
        }
      )
    })

    return unsub
  }, [token, qc])
}
