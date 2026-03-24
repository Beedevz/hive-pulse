import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../infrastructure/apiClient'
import type { IncidentList } from '../domain/incident'

export type IncidentFilter = 'all' | 'active' | 'resolved'

export function useIncidents(status: IncidentFilter = 'all') {
  return useQuery<IncidentList>({
    queryKey: ['incidents', status],
    queryFn: () =>
      apiClient
        .get(`/incidents?status=${status}&limit=100`)
        .then((r) => r.data),
    refetchInterval: 30_000,
  })
}
