// Copyright (C) 2024 Beedevz. Licensed under AGPL v3 — see LICENSE for details.
package domain

import "time"

type StatusPage struct {
	ID           string    `json:"id"`
	Slug         string    `json:"slug"`
	Title        string    `json:"title"`
	Description  string    `json:"description"`
	LogoURL      string    `json:"logo_url"`
	AccentColor  string    `json:"accent_color"`
	CustomDomain string    `json:"custom_domain"`
	TagIDs       []string  `json:"tag_ids"` // resolved from status_page_tags
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type PublicMonitorRow struct {
	ID           string        `json:"id"`
	Name         string        `json:"name"`
	CheckType    string        `json:"check_type"`
	LastStatus   string        `json:"last_status"`
	Uptime24h    float64       `json:"uptime_24h"`
	Uptime90d    float64       `json:"uptime_90d"`
	DailyBuckets []DailyBucket `json:"daily_buckets"`
}

type DailyBucket struct {
	Date      string  `json:"date"`
	UptimePct float64 `json:"uptime_pct"`
}

type PublicIncident struct {
	ID          string     `json:"id"`
	MonitorName string     `json:"monitor_name"`
	StartedAt   time.Time  `json:"started_at"`
	ResolvedAt  *time.Time `json:"resolved_at,omitempty"`
	DurationS   int        `json:"duration_s"`
	ErrorMsg    string     `json:"error_msg"`
}

type PublicStatusPageData struct {
	Title           string             `json:"title"`
	Description     string             `json:"description"`
	AccentColor     string             `json:"accent_color"`
	LogoURL         string             `json:"logo_url"`
	OverallStatus   string             `json:"overall_status"`
	Monitors        []PublicMonitorRow  `json:"monitors"`
	ActiveIncidents []PublicIncident    `json:"active_incidents"`
	RecentIncidents []PublicIncident    `json:"recent_incidents"`
}
