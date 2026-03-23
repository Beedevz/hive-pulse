export type CheckType = 'http' | 'tcp' | 'ping' | 'dns'
export type MonitorStatus = 'up' | 'down' | 'unknown'

export interface Monitor {
  id: string
  name: string
  check_type: CheckType
  interval: number
  timeout: number
  retries: number
  retry_interval: number
  enabled: boolean
  url?: string
  method?: string
  expected_status?: number
  request_headers?: string
  request_body?: string
  follow_redirects?: boolean
  host?: string
  port?: number
  ping_host?: string
  packet_count?: number
  dns_host?: string
  record_type?: string
  expected_value?: string
  dns_server?: string
  last_status: MonitorStatus
  uptime_24h: number
  created_at: string
}

export type CreateMonitorPayload = Omit<Monitor, 'id' | 'last_status' | 'uptime_24h' | 'created_at'>

export interface PaginatedMonitors {
  data: Monitor[]
  total: number
  page: number
  limit: number
}
