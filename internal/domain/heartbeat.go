// Copyright (C) 2024 Beedevz. Licensed under AGPL v3 — see LICENSE for details.
package domain

import "time"

type Heartbeat struct {
	ID         int64
	MonitorID  string
	Status     string // "up" | "down"
	PingMS     int
	StatusCode int    // HTTP: response code; TCP/PING/DNS: 0
	ErrorMsg   string
	CheckedAt  time.Time // set by checker adapter, not DB default
}
