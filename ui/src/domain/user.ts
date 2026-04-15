export interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'editor' | 'viewer'
}

export interface AuthTokens {
  access_token: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface SetupRequest {
  name: string
  email: string
  password: string
}

export interface SetupStatus {
  setup_required: boolean
}
