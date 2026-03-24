import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../infrastructure/apiClient'
import type { StatsResponse, StatsRange } from '../domain/stats'

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
