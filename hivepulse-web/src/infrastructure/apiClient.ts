import axios from 'axios'
import { useAuthStore } from '../shared/authStore'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api/v1',
  withCredentials: true,
})

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let isRefreshing = false
let queue: Array<(token: string) => void> = []

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error)
    }
    original._retry = true

    if (isRefreshing) {
      return new Promise((resolve) => {
        queue.push((token) => {
          original.headers.Authorization = `Bearer ${token}`
          resolve(apiClient(original))
        })
      })
    }

    isRefreshing = true
    try {
      const { data } = await apiClient.post<{ access_token: string }>('/auth/refresh')
      useAuthStore.getState().setAccessToken(data.access_token)
      queue.forEach((cb) => cb(data.access_token))
      queue = []
      original.headers.Authorization = `Bearer ${data.access_token}`
      return apiClient(original)
    } catch {
      useAuthStore.getState().clearAccessToken()
      if (typeof window !== 'undefined') window.location.href = '/login'
      return Promise.reject(error)
    } finally {
      isRefreshing = false
    }
  }
)
