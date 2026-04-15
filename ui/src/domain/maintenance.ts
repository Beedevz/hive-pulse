export interface MaintenanceWindow {
  id: string
  monitor_id: string | null
  starts_at: string
  ends_at: string
  reason: string
  created_at: string
}
