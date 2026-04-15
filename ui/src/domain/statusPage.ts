import type { Tag } from './tag'

export interface StatusPage {
  id: string
  slug: string
  title: string
  description: string
  logo_url: string | null
  accent_color: string
  custom_domain: string | null
  tag_ids: string[]
  created_at: string
}

export interface DailyBucket {
  date: string
  uptime_pct: number
}

export interface PublicMonitorRow {
  id: string
  name: string
  check_type: string
  last_status: 'up' | 'down' | 'unknown'
  uptime_24h: number
  uptime_90d: number
  daily_buckets: DailyBucket[]
}

export interface PublicIncident {
  id: string
  monitor_name: string
  started_at: string
  resolved_at: string | null
  duration_s: number
  error_msg: string
}

export interface PublicStatusPageData {
  title: string
  description: string
  accent_color: string
  logo_url: string | null
  overall_status: 'operational' | 'degraded' | 'outage'
  monitors: PublicMonitorRow[]
  active_incidents: PublicIncident[]
  recent_incidents: PublicIncident[]
}

export interface CreateStatusPageInput {
  title: string
  slug?: string
  description?: string
  logo_url?: string
  accent_color: string
  custom_domain?: string
  tag_ids: string[]
}

export type { Tag }
