// hivepulse-api/internal/usecase/checker_usecase.go
package usecase

import (
	"context"
	"encoding/json"
	"log"
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
	monitors    port.MonitorRepository
	heartbeats  port.HeartbeatRepository
	incidents   port.IncidentRepository
	checkers    map[domain.CheckType]port.CheckerService
	hub         port.WSBroadcaster
	notifier    port.Notifier
	maintenance port.MaintenanceWindowRepository
}

func NewCheckerUsecase(
	monitors port.MonitorRepository,
	heartbeats port.HeartbeatRepository,
	incidents port.IncidentRepository,
	checkers map[domain.CheckType]port.CheckerService,
	hub port.WSBroadcaster,
	maintenance port.MaintenanceWindowRepository,
) *CheckerUsecase {
	return &CheckerUsecase{
		monitors:    monitors,
		heartbeats:  heartbeats,
		incidents:   incidents,
		checkers:    checkers,
		hub:         hub,
		maintenance: maintenance,
	}
}

func (u *CheckerUsecase) SetNotifier(n port.Notifier) { u.notifier = n }

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

	// Check if monitor is in maintenance — skip incident creation + notifications
	if u.maintenance != nil {
		inMaint, mErr := u.maintenance.IsMonitorInMaintenance(ctx, monitorID, heartbeat.CheckedAt)
		if mErr != nil {
			log.Printf("checker: IsMonitorInMaintenance error for %q: %v", monitorID, mErr)
		}
		if inMaint {
			log.Printf("checker: monitor %q is in maintenance, skipping incident/notification", monitorID)
			if err := u.monitors.UpdateLastStatus(ctx, monitorID, "maintenance"); err != nil {
				log.Printf("checker: UpdateLastStatus(maintenance) failed for %q: %v", monitorID, err)
			}
			event, _ := json.Marshal(HeartbeatEvent{
				Type: "heartbeat", MonitorID: monitorID, Status: "maintenance",
				PingMS: heartbeat.PingMS, CheckedAt: heartbeat.CheckedAt,
			})
			u.hub.Broadcast(event)
			return
		}
	}

	prevStatus := monitor.LastStatus
	newStatus := heartbeat.Status

	if err := u.monitors.UpdateLastStatus(ctx, monitorID, newStatus); err != nil {
		log.Printf("checker: UpdateLastStatus failed for %q: %v", monitorID, err)
	}

	switch {
	case prevStatus != "down" && newStatus == "down":
		if err := u.incidents.Create(ctx, &domain.Incident{
			MonitorID:   monitorID,
			MonitorName: monitor.Name,
			StartedAt:   heartbeat.CheckedAt,
			ErrorMsg:    heartbeat.ErrorMsg,
		}); err != nil {
			log.Printf("checker: incidents.Create failed for %q: %v", monitorID, err)
		}
		if u.notifier != nil {
			go u.notifier.Notify(ctx, monitorID, domain.EventDown)
		}
	case prevStatus == "down" && newStatus == "up":
		if err := u.incidents.Resolve(ctx, monitorID, heartbeat.CheckedAt); err != nil {
			log.Printf("checker: incidents.Resolve failed for %q: %v", monitorID, err)
		}
		if u.notifier != nil {
			go u.notifier.Notify(ctx, monitorID, domain.EventUp)
		}
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
