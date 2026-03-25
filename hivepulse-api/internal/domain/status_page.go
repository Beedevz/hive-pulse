package domain

import "time"

type StatusPage struct {
	ID           string
	Slug         string
	Title        string
	Description  string
	LogoURL      string
	AccentColor  string
	CustomDomain string
	TagIDs       []string // resolved from status_page_tags
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

type PublicMonitorRow struct {
	ID           string
	Name         string
	CheckType    string
	LastStatus   string
	Uptime24h    float64
	Uptime90d    float64
	DailyBuckets []DailyBucket
}

type DailyBucket struct {
	Date      string // "2006-01-02"
	UptimePct float64
}

type PublicIncident struct {
	ID          string
	MonitorName string
	StartedAt   time.Time
	ResolvedAt  *time.Time
	DurationS   int
	ErrorMsg    string
}

type PublicStatusPageData struct {
	Title           string
	Description     string
	AccentColor     string
	LogoURL         string
	OverallStatus   string // "operational" | "degraded" | "outage"
	Monitors        []PublicMonitorRow
	ActiveIncidents []PublicIncident
	RecentIncidents []PublicIncident
}
