// Copyright (C) 2024 Beedevz. Licensed under AGPL v3 — see LICENSE for details.
package port

import (
	"context"

	"github.com/beedevz/hivepulse/internal/domain"
)

// CheckerService is implemented by each check-type adapter (HTTP, TCP, PING, DNS).
// It MUST never return (nil, err) — always return a valid Heartbeat with Status "down" on failure.
type CheckerService interface {
	Check(ctx context.Context, m *domain.Monitor) (*domain.Heartbeat, error)
}

// CheckRunner is implemented by CheckerUsecase.
// Scheduler holds this interface to avoid infrastructure → usecase import.
type CheckRunner interface {
	RunCheck(ctx context.Context, monitorID string)
}

// WSBroadcaster is implemented by Hub. Injected into CheckerUsecase.
type WSBroadcaster interface {
	Broadcast(data []byte)
}

// SchedulerService is implemented by Scheduler. Injected into MonitorUsecase.
type SchedulerService interface {
	Add(m *domain.Monitor)
	Remove(monitorID string)
	Update(m *domain.Monitor) // calls Remove then Add (handles interval + enabled changes)
}
