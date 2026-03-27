import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../infrastructure/apiClient'
import type { NotificationChannel, NotificationLog, CreateChannelInput, MonitorChannelAssignment, AssignmentTriggers } from '../domain/notification'

export const useChannels = () =>
  useQuery<NotificationChannel[]>({
    queryKey: ['notification-channels'],
    queryFn: () =>
      apiClient.get('/notification-channels').then((r) => r.data.data),
  })

export const useCreateChannel = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateChannelInput) =>
      apiClient.post('/notification-channels', input).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notification-channels'] }),
  })
}

export const useUpdateChannel = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string } & CreateChannelInput) =>
      apiClient.put(`/notification-channels/${id}`, input).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notification-channels'] }),
  })
}

export const useDeleteChannel = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (channelId: string) =>
      apiClient.delete(`/notification-channels/${channelId}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notification-channels'] }),
  })
}

export const useChannelLogs = (channelId: string, isOpen: boolean) =>
  useQuery<NotificationLog[]>({
    queryKey: ['notification-channels', channelId, 'logs'],
    queryFn: () =>
      apiClient.get(`/notification-channels/${channelId}/logs`).then((r) => r.data.data),
    enabled: !!channelId && isOpen,
    staleTime: 60_000,
  })

export const useMonitorChannels = (monitorId: string) =>
  useQuery<MonitorChannelAssignment[]>({
    queryKey: ['monitor-channels', monitorId],
    queryFn: () =>
      apiClient.get(`/monitors/${monitorId}/channels`).then((r) => r.data.data),
    enabled: !!monitorId,
  })

export const useAssignChannel = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ monitorId, channelId }: { monitorId: string; channelId: string }) =>
      apiClient.post(`/monitors/${monitorId}/channels/${channelId}`).then((r) => r.data),
    onSuccess: (_, { monitorId }) =>
      qc.invalidateQueries({ queryKey: ['monitor-channels', monitorId] }),
  })
}

export const useUnassignChannel = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ monitorId, channelId }: { monitorId: string; channelId: string }) =>
      apiClient.delete(`/monitors/${monitorId}/channels/${channelId}`).then((r) => r.data),
    onSuccess: (_, { monitorId }) =>
      qc.invalidateQueries({ queryKey: ['monitor-channels', monitorId] }),
  })
}

export const useUpdateAssignmentTriggers = (monitorId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ channelId, triggers }: { channelId: string; triggers: AssignmentTriggers }) =>
      apiClient.put(`/monitors/${monitorId}/channels/${channelId}/triggers`, triggers).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['monitor-channels', monitorId] }),
  })
}

export const useTestChannel = () =>
  useMutation({
    mutationFn: (channelId: string) =>
      apiClient.post(`/notification-channels/${channelId}/test`).then((r) => r.data),
  })

export interface SMTPSettings {
  host: string
  port: number
  user: string
  password: string
  from: string
}

export const useSMTPSettings = () =>
  useQuery<SMTPSettings>({
    queryKey: ['settings', 'smtp'],
    queryFn: () => apiClient.get('/settings/smtp').then((r) => r.data),
  })

export const useUpdateSMTPSettings = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: SMTPSettings) =>
      apiClient.put('/settings/smtp', input).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings', 'smtp'] }),
  })
}
