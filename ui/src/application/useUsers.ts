import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../infrastructure/apiClient'
import type { User } from '../domain/user'

interface PaginatedUsers {
  data: User[]
  total: number
  page: number
  limit: number
}

export const useUsers = (page = 1, limit = 20) =>
  useQuery<PaginatedUsers>({
    queryKey: ['users', page, limit],
    queryFn: () =>
      apiClient.get(`/users?page=${page}&limit=${limit}`).then((r) => r.data),
  })

export const useUpdateUserRole = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      apiClient.put(`/users/${id}/role`, { role }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })
}

export const useDeleteUser = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/users/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })
}
