// Copyright (C) 2024 Beedevz. Licensed under AGPL v3 — see LICENSE for details.
package domain

import "time"

type MaintenanceWindow struct {
	ID        string
	MonitorID *string
	StartsAt  time.Time
	EndsAt    time.Time
	Reason    string
	CreatedAt time.Time
}
