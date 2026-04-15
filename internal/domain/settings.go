// Copyright (C) 2024 Beedevz. Licensed under AGPL v3 — see LICENSE for details.
package domain

// GeneralSettings holds application-wide configuration.
type GeneralSettings struct {
	Timezone string `json:"timezone"` // IANA timezone, e.g. "Europe/Istanbul"
}
