import { create } from 'zustand'

interface AuthState {
  accessToken: string | null
  hydrated: boolean
  setAccessToken: (token: string) => void
  clearAccessToken: () => void
  setHydrated: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  hydrated: false,
  setAccessToken: (token) => set({ accessToken: token }),
  clearAccessToken: () => set({ accessToken: null }),
  setHydrated: () => set({ hydrated: true }),
}))
