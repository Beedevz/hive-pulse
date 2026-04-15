export interface StatsBucket {
  time: string
  up_count: number
  total_count: number
  avg_ping_ms: number
}

export interface DownPeriod {
  started_at: string
  resolved_at?: string // omitted (not null) for active incidents
}

export interface StatsResponse {
  uptime_pct: number
  avg_ping_ms: number
  buckets: StatsBucket[]
  down_periods: DownPeriod[]
}

export type StatsRange = '1h' | '3h' | '6h' | '24h' | '48h' | '7d' | '15d' | '30d' | '90d'

export interface OverviewStats {
  avg_ping_ms: number
  buckets: StatsBucket[]
}
