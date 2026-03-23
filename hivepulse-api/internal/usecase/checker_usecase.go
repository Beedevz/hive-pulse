package usecase

import (
	"context"
	"encoding/json"
	"time"

	"github.com/beedevz/hivepulse/internal/domain"
	"github.com/beedevz/hivepulse/internal/port"
)

type HeartbeatEvent struct {
	Type      string    `json:"type"`
	MonitorID string    `json:"monitor_id"`
	Status    string    `json:"status"`
	PingMS    int       `json:"ping_ms"`
	CheckedAt time.Time `json:"checked_at"`
}

type CheckerUsecase struct {
	monitors   port.MonitorRepository
	heartbeats port.HeartbeatRepository
	checkers   map[domain.CheckType]port.CheckerService
	hub        port.WSBroadcaster
}

func NewCheckerUsecase(
	monitors port.MonitorRepository,
	heartbeats port.HeartbeatRepository,
	checkers map[domain.CheckType]port.CheckerService,
	hub port.WSBroadcaster,
) *CheckerUsecase {
	return &CheckerUsecase{monitors: monitors, heartbeats: heartbeats, checkers: checkers, hub: hub}
}

// RunCheck implements port.CheckRunner.
func (u *CheckerUsecase) RunCheck(ctx context.Context, monitorID string) {
	monitor, err := u.monitors.FindByID(ctx, monitorID)
	if err != nil || !monitor.Enabled {
		return
	}

	checker, ok := u.checkers[monitor.CheckType]
	if !ok {
		return
	}

	var heartbeat *domain.Heartbeat
	for attempt := 0; attempt <= monitor.Retries; attempt++ {
		// checker never returns (nil, err) — always returns a valid heartbeat
		heartbeat, _ = checker.Check(ctx, monitor)
		if heartbeat.Status == "up" {
			break
		}
		if attempt < monitor.Retries && monitor.RetryInterval > 0 {
			time.Sleep(time.Duration(monitor.RetryInterval) * time.Second)
		}
	}

	heartbeat.MonitorID = monitorID
	if err := u.heartbeats.Create(ctx, heartbeat); err != nil {
		return
	}

	event, _ := json.Marshal(HeartbeatEvent{
		Type:      "heartbeat",
		MonitorID: monitorID,
		Status:    heartbeat.Status,
		PingMS:    heartbeat.PingMS,
		CheckedAt: heartbeat.CheckedAt,
	})
	u.hub.Broadcast(event)
}
