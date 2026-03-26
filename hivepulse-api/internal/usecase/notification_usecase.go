package usecase

import (
	"context"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/beedevz/hivepulse/internal/domain"
	"github.com/beedevz/hivepulse/internal/port"
)

type NotificationUsecase struct {
	repo     port.NotificationRepository
	sender   port.NotificationSender
	monitors port.MonitorRepository
	settings port.SettingsRepository
}

func NewNotificationUsecase(
	repo     port.NotificationRepository,
	sender   port.NotificationSender,
	monitors port.MonitorRepository,
	settings port.SettingsRepository,
) *NotificationUsecase {
	return &NotificationUsecase{repo: repo, sender: sender, monitors: monitors, settings: settings}
}

func (u *NotificationUsecase) Notify(ctx context.Context, monitorID string, event domain.NotificationEvent) {
	assignments, err := u.repo.GetChannelsForMonitor(ctx, monitorID)
	if err != nil {
		log.Printf("notification: GetChannelsForMonitor failed for %q: %v", monitorID, err)
		return
	}
	for _, a := range assignments {
		u.notifyChannel(ctx, monitorID, a, event)
	}
}

func (u *NotificationUsecase) notifyChannel(ctx context.Context, monitorID string, assignment domain.MonitorChannelAssignment, event domain.NotificationEvent) {
	ch := assignment.Channel
	triggers := assignment.Triggers

	// Cooldown check
	if triggers.CooldownMinutes > 0 {
		lastSent, err := u.repo.LastSentAt(ctx, monitorID, ch.ID)
		if err == nil && !lastSent.IsZero() &&
			time.Since(lastSent) < time.Duration(triggers.CooldownMinutes)*time.Minute {
			return
		}
	}

	// Schedule check
	if triggers.Schedule != nil {
		gs, err := u.settings.GetGeneral(ctx)
		if err != nil {
			log.Printf("notification: GetGeneral failed, skipping schedule check: %v", err)
		} else {
			loc, err := time.LoadLocation(gs.Timezone)
			if err != nil {
				log.Printf("notification: invalid timezone %q, skipping schedule check: %v", gs.Timezone, err)
			} else {
				within, err := IsWithinSchedule(time.Now().In(loc), triggers.Schedule)
				if err != nil {
					log.Printf("notification: schedule parse error, skipping schedule check: %v", err)
				} else if !within {
					return
				}
			}
		}
	}

	monitor, err := u.monitors.FindByID(ctx, monitorID)
	if err != nil {
		log.Printf("notification: FindByID %q failed: %v", monitorID, err)
		return
	}

	var lastErr error
	for attempt := 0; attempt < 3; attempt++ {
		lastErr = u.sender.Send(ctx, ch, event, monitor)
		if lastErr == nil {
			break
		}
		log.Printf("notification: send attempt %d failed for channel %s: %v", attempt+1, ch.ID, lastErr)
	}

	status := "sent"
	errMsg := ""
	if lastErr != nil {
		status = "failed"
		errMsg = lastErr.Error()
	}
	if logErr := u.repo.LogNotification(ctx, &domain.NotificationLog{
		ChannelID: ch.ID,
		MonitorID: monitorID,
		Event:     event,
		Status:    status,
		ErrorMsg:  errMsg,
	}); logErr != nil {
		log.Printf("notification: LogNotification failed: %v", logErr)
	}
}

func (u *NotificationUsecase) NotifyReminders(ctx context.Context) error {
	targets, err := u.repo.FindReminders(ctx)
	if err != nil {
		return err
	}
	for _, t := range targets {
		assignments, err := u.repo.GetChannelsForMonitor(ctx, t.MonitorID)
		if err != nil {
			log.Printf("notification: GetChannelsForMonitor failed in NotifyReminders for %q: %v", t.MonitorID, err)
			continue
		}
		for _, a := range assignments {
			if a.Channel.ID == t.ChannelID {
				u.notifyChannel(ctx, t.MonitorID, a, domain.EventDown)
				break
			}
		}
	}
	return nil
}

// IsWithinSchedule reports whether now falls within the schedule window.
// Exported for testing. Returns error if time strings are malformed.
func IsWithinSchedule(now time.Time, s *domain.ScheduleRule) (bool, error) {
	day := strings.ToLower(now.Weekday().String()[:3])
	dayMatch := false
	for _, d := range s.Days {
		if d == day {
			dayMatch = true
			break
		}
	}
	if !dayMatch {
		return false, nil
	}
	start, err := time.Parse("15:04", s.Start)
	if err != nil {
		return false, fmt.Errorf("invalid start time %q: %w", s.Start, err)
	}
	end, err := time.Parse("15:04", s.End)
	if err != nil {
		return false, fmt.Errorf("invalid end time %q: %w", s.End, err)
	}
	current, err := time.Parse("15:04", now.Format("15:04"))
	if err != nil {
		return false, err
	}
	return !current.Before(start) && current.Before(end), nil
}

func (u *NotificationUsecase) CreateChannel(ctx context.Context, ch *domain.NotificationChannel) error {
	return u.repo.CreateChannel(ctx, ch)
}
func (u *NotificationUsecase) UpdateChannel(ctx context.Context, ch *domain.NotificationChannel) error {
	return u.repo.UpdateChannel(ctx, ch)
}
func (u *NotificationUsecase) DeleteChannel(ctx context.Context, id string) error {
	return u.repo.DeleteChannel(ctx, id)
}
func (u *NotificationUsecase) ListChannels(ctx context.Context) ([]*domain.NotificationChannel, error) {
	return u.repo.ListChannels(ctx)
}
func (u *NotificationUsecase) AssignChannel(ctx context.Context, monitorID, channelID string) error {
	return u.repo.AssignChannel(ctx, monitorID, channelID)
}
func (u *NotificationUsecase) UnassignChannel(ctx context.Context, monitorID, channelID string) error {
	return u.repo.UnassignChannel(ctx, monitorID, channelID)
}
func (u *NotificationUsecase) GetChannelsForMonitor(ctx context.Context, monitorID string) ([]domain.MonitorChannelAssignment, error) {
	return u.repo.GetChannelsForMonitor(ctx, monitorID)
}
func (u *NotificationUsecase) UpdateAssignmentTriggers(ctx context.Context, monitorID, channelID string, triggers domain.AssignmentTriggers) error {
	return u.repo.UpdateAssignmentTriggers(ctx, monitorID, channelID, triggers)
}
func (u *NotificationUsecase) ListLogs(ctx context.Context, channelID string) ([]*domain.NotificationLog, error) {
	return u.repo.ListLogs(ctx, channelID)
}
func (u *NotificationUsecase) SendTest(ctx context.Context, channelID string, monitor *domain.Monitor) error {
	ch, err := u.repo.GetChannel(ctx, channelID)
	if err != nil {
		return err
	}
	return u.sender.Send(ctx, ch, domain.EventDown, monitor)
}
