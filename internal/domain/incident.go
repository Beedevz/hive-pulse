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
