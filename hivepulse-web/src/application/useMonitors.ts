import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../infrastructure/apiClient'
import type { CreateMonitorPayload, Heartbeat, Monitor, PaginatedMonitors } from '../domain/monitor'

export const useMonitors = (page = 1, limit = 20) =>
  useQuery<PaginatedMonitors>({
    queryKey: ['monitors', page, limit],
    queryFn: () =>
      apiClient.get(`/monitors?page=${page}&limit=${limit}`).then((r) => r.data),
    refetchInterval: 60_000,
  })

export const useHeartbeats = (monitorID: string) =>
  useQuery<{ data: Heartbeat[] }>({
    queryKey: ['heartbeats', monitorID],
    queryFn: () =>
      apiClient.get(`/monitors/${monitorID}/heartbeats?limit=48`).then(r => r.data),
    enabled: !!monitorID,
  })

export const useMonitor = (id: string) =>
  useQuery<Monitor>({
    queryKey: ['monitors', id],
    queryFn: () => apiClient.get(`/monitors/${id}`).then((r) => r.data),
    enabled: !!id,
  })

export const useCreateMonitor = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateMonitorPayload) =>
      apiClient.post('/monitors', payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['monitors'] }),
  })
}

export const useUpdateMonitor = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CreateMonitorPayload }) =>
      apiClient.put(`/monitors/${id}`, payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['monitors'] }),
  })
}

export const useDeleteMonitor = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/monitors/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['monitors'] }),
  })
}
