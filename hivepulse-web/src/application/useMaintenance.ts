import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../infrastructure/apiClient'
import type { MaintenanceWindow } from '../domain/maintenance'

export function useMonitorMaintenance(monitorId: string) {
  return useQuery<{ data: MaintenanceWindow[] }>({
    queryKey: ['maintenance', monitorId],
    queryFn: () => apiClient.get(`/monitors/${monitorId}/maintenance`).then((r) => r.data),
    enabled: !!monitorId,
  })
}

export function useGlobalMaintenance() {
  return useQuery<{ data: MaintenanceWindow[] }>({
    queryKey: ['maintenance', 'global'],
    queryFn: () => apiClient.get('/maintenance-windows').then((r) => r.data),
  })
}

export function useCreateMaintenance() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: { monitor_id?: string; starts_at: string; ends_at: string; reason: string }) =>
      apiClient.post('/maintenance-windows', payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['maintenance'] })
      qc.invalidateQueries({ queryKey: ['monitors'] })
    },
  })
}

export function useDeleteMaintenance() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/maintenance-windows/${id}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['maintenance'] })
      qc.invalidateQueries({ queryKey: ['monitors'] })
    },
  })
}
