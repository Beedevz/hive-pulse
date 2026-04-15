// Copyright (C) 2024 Beedevz. Licensed under AGPL v3 — see LICENSE for details.
// hivepulse-api/internal/domain/incident.go
package domain

import "time"

type Incident struct {
	ID          int64
	MonitorID   string
	MonitorName string
	StartedAt   time.Time
	ResolvedAt  *time.Time
	ErrorMsg    string
}
