package domain

import "time"

type StatsBucket struct {
	Time       time.Time `json:"time"`
	UpCount    int       `json:"up_count"`
	TotalCount int       `json:"total_count"`
	AvgPingMS  int       `json:"avg_ping_ms"`
}

type DownPeriod struct {
	StartedAt  time.Time  `json:"started_at"`
	ResolvedAt *time.Time `json:"resolved_at,omitempty"`
}

type StatsResponse struct {
	UptimePct   float64        `json:"uptime_pct"`
	AvgPingMS   int            `json:"avg_ping_ms"`
	Buckets     []*StatsBucket `json:"buckets"`
	DownPeriods []*DownPeriod  `json:"down_periods"`
}
