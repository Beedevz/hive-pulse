import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../infrastructure/apiClient'
import type { IncidentList } from '../domain/incident'

export type IncidentFilter = 'all' | 'active' | 'resolved'

export const PAGE_SIZE = 20

export function useIncidents(
  status: IncidentFilter = 'all',
  q = '',
  page = 1,
) {
  const offset = (page - 1) * PAGE_SIZE
  return useQuery<IncidentList>({
    queryKey: ['incidents', status, q, page],
    queryFn: () =>
      apiClient
        .get<IncidentList>(
          `/incidents?status=${status}&q=${encodeURIComponent(q)}&offset=${offset}&limit=${PAGE_SIZE}`
        )
        .then((r) => r.data),
    refetchInterval: 30_000,
  })
}
