// Copyright (C) 2024 Beedevz. Licensed under AGPL v3 — see LICENSE for details.
package domain

import "time"

type Tag struct {
	ID        string
	Name      string
	Color     string
	CreatedAt time.Time
}
