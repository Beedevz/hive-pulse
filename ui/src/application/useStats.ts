import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../infrastructure/apiClient'
import type { StatsResponse, StatsRange, OverviewStats } from '../domain/stats'

async function fetchStats(monitorId: string, range: StatsRange): Promise<StatsResponse> {
  const { data } = await apiClient.get<StatsResponse>(`/monitors/${monitorId}/stats`, {
    params: { range },
  })
  return data
}

export function useStats(monitorId: string, range: StatsRange) {
  return useQuery({
    queryKey: ['stats', monitorId, range],
    queryFn: () => fetchStats(monitorId, range),
    enabled: !!monitorId,
  })
}

export function useOverviewStats() {
  return useQuery<OverviewStats>({
    queryKey: ['stats', 'overview'],
    queryFn: () => apiClient.get<OverviewStats>('/stats/overview').then((r) => r.data),
    refetchInterval: 60_000,
  })
}
