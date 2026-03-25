export interface StatsBucket {
  time: string;
  up_count: number;
  total_count: number;
  avg_ping_ms: number;
}

export interface StatsResponse {
  uptime_pct: number;
  avg_ping_ms: number;
  buckets: StatsBucket[];
}

export type StatsRange = '24h' | '7d' | '30d' | '90d';
