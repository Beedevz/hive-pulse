import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../infrastructure/apiClient'
import type { GeneralSettings } from '../domain/settings'

export const useGeneralSettings = () =>
  useQuery<GeneralSettings>({
    queryKey: ['settings-general'],
    queryFn: () => apiClient.get('/settings/general').then((r) => r.data),
  })

export const useSaveGeneralSettings = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (gs: GeneralSettings) =>
      apiClient.put('/settings/general', gs).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings-general'] }),
  })
}
