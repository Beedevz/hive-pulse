import { useMutation, useQuery, useQueries, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../infrastructure/apiClient'
import type { Tag } from '../domain/tag'

export const useTags = () =>
  useQuery<Tag[]>({
    queryKey: ['tags'],
    queryFn: () => apiClient.get('/tags').then((r) => r.data.data),
  })

export const useCreateTag = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { name: string; color: string }) =>
      apiClient.post('/tags', input).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tags'] }),
  })
}

export const useDeleteTag = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/tags/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tags'] })
      qc.invalidateQueries({ queryKey: ['monitor-tags'] })
    },
  })
}

export const useMonitorTags = (monitorId: string) =>
  useQuery<Tag[]>({
    queryKey: ['monitor-tags', monitorId],
    queryFn: () => apiClient.get(`/monitors/${monitorId}/tags`).then((r) => r.data.data),
    enabled: !!monitorId,
  })

export const useAssignTag = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ monitorId, tagId }: { monitorId: string; tagId: string }) =>
      apiClient.post(`/monitors/${monitorId}/tags/${tagId}`),
    onSuccess: (_, { monitorId }) =>
      qc.invalidateQueries({ queryKey: ['monitor-tags', monitorId] }),
  })
}

export const useUnassignTag = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ monitorId, tagId }: { monitorId: string; tagId: string }) =>
      apiClient.delete(`/monitors/${monitorId}/tags/${tagId}`),
    onSuccess: (_, { monitorId }) =>
      qc.invalidateQueries({ queryKey: ['monitor-tags', monitorId] }),
  })
}

export const useMonitorTagsMap = (monitorIds: string[]): Record<string, Tag[]> => {
  const results = useQueries({
    queries: monitorIds.map((id) => ({
      queryKey: ['monitor-tags', id],
      queryFn: () => apiClient.get(`/monitors/${id}/tags`).then((r) => r.data.data as Tag[]),
      enabled: monitorIds.length > 0,
    })),
  })
  const map: Record<string, Tag[]> = {}
  monitorIds.forEach((id, i) => { map[id] = results[i].data ?? [] })
  return map
}
