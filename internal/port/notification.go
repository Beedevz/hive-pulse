// Copyright (C) 2024 Beedevz. Licensed under AGPL v3 — see LICENSE for details.
package port

import (
	"context"
	"time"

	"github.com/beedevz/hivepulse/internal/domain"
)

type NotificationRepository interface {
	CreateChannel(ctx context.Context, ch *domain.NotificationChannel) error
	UpdateChannel(ctx context.Context, ch *domain.NotificationChannel) error
	DeleteChannel(ctx context.Context, id string) error
	ListChannels(ctx context.Context) ([]*domain.NotificationChannel, error)
	GetChannel(ctx context.Context, id string) (*domain.NotificationChannel, error)
	GetChannelsForMonitor(ctx context.Context, monitorID string) ([]domain.MonitorChannelAssignment, error)
	UpdateAssignmentTriggers(ctx context.Context, monitorID, channelID string, triggers domain.AssignmentTriggers) error
	LastSentAt(ctx context.Context, monitorID, channelID string) (time.Time, error)
	AssignChannel(ctx context.Context, monitorID, channelID string) error
	UnassignChannel(ctx context.Context, monitorID, channelID string) error
	LogNotification(ctx context.Context, log *domain.NotificationLog) error
	ListLogs(ctx context.Context, channelID string) ([]*domain.NotificationLog, error)
	FindReminders(ctx context.Context) ([]*domain.ReminderTarget, error)
	HasRecentSSLLog(ctx context.Context, monitorID string, within time.Duration) (bool, error)
}

type NotificationSender interface {
	Send(ctx context.Context, ch *domain.NotificationChannel, event domain.NotificationEvent, monitor *domain.Monitor) error
}

type Notifier interface {
	Notify(ctx context.Context, monitorID string, event domain.NotificationEvent)
}

type ReminderNotifier interface {
	NotifyReminders(ctx context.Context) error
}
