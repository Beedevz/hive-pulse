export interface Incident {
  id: number
  monitor_id: string
  monitor_name: string
  started_at: string
  resolved_at: string | null
  duration_s: number
  error_msg: string
}

export interface IncidentList {
  data: Incident[]
  total: number
}
