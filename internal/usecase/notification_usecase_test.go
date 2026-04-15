// Copyright (C) 2024 Beedevz. Licensed under AGPL v3 — see LICENSE for details.
package usecase_test

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/beedevz/hivepulse/internal/domain"
	"github.com/beedevz/hivepulse/internal/usecase"
	"github.com/beedevz/hivepulse/internal/usecase/mocks"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
)

func TestNotify_GlobalChannels(t *testing.T) {
	repo := mocks.NewNotificationRepository(t)
	sender := mocks.NewNotificationSender(t)
	settingsRepo := mocks.NewSettingsRepository(t)

	monitor := &domain.Monitor{ID: "m1", Name: "API", CheckType: domain.CheckHTTP}
	ch := &domain.NotificationChannel{ID: "ch1", Type: domain.ChannelEmail, Enabled: true, IsGlobal: true, Config: map[string]string{"to": "a@b.com"}}

	repo.On("GetChannelsForMonitor", mock.Anything, "m1").Return(
		[]domain.MonitorChannelAssignment{{Channel: ch}}, nil,
	)
	sender.On("Send", mock.Anything, ch, domain.EventDown, mock.Anything).Return(nil)
	repo.On("LogNotification", mock.Anything, mock.MatchedBy(func(l *domain.NotificationLog) bool {
		return l.Status == "sent" && l.Event == domain.EventDown
	})).Return(nil)

	monitorRepo := mocks.NewMonitorRepository(t)
	monitorRepo.On("FindByID", mock.Anything, "m1").Return(monitor, nil)

	uc := usecase.NewNotificationUsecase(repo, sender, monitorRepo, settingsRepo)
	uc.Notify(context.Background(), "m1", domain.EventDown)

	sender.AssertCalled(t, "Send", mock.Anything, ch, domain.EventDown, mock.Anything)
	repo.AssertCalled(t, "LogNotification", mock.Anything, mock.Anything)
}

func TestNotify_RetriesOnFailure(t *testing.T) {
	repo := mocks.NewNotificationRepository(t)
	sender := mocks.NewNotificationSender(t)
	settingsRepo := mocks.NewSettingsRepository(t)

	monitor := &domain.Monitor{ID: "m1", Name: "API"}
	ch := &domain.NotificationChannel{ID: "ch1", Type: domain.ChannelWebhook, Enabled: true, Config: map[string]string{"url": "http://x"}}

	repo.On("GetChannelsForMonitor", mock.Anything, "m1").Return(
		[]domain.MonitorChannelAssignment{{Channel: ch}}, nil,
	)
	sender.On("Send", mock.Anything, ch, domain.EventDown, mock.Anything).Return(errors.New("timeout")).Once()
	sender.On("Send", mock.Anything, ch, domain.EventDown, mock.Anything).Return(errors.New("timeout")).Once()
	sender.On("Send", mock.Anything, ch, domain.EventDown, mock.Anything).Return(nil).Once()
	repo.On("LogNotification", mock.Anything, mock.MatchedBy(func(l *domain.NotificationLog) bool {
		return l.Status == "sent"
	})).Return(nil)

	monitorRepo := mocks.NewMonitorRepository(t)
	monitorRepo.On("FindByID", mock.Anything, "m1").Return(monitor, nil)

	uc := usecase.NewNotificationUsecase(repo, sender, monitorRepo, settingsRepo)
	uc.Notify(context.Background(), "m1", domain.EventDown)

	assert.Equal(t, 3, len(sender.Calls))
}

func TestNotify_LogsFailedAfter3Attempts(t *testing.T) {
	repo := mocks.NewNotificationRepository(t)
	sender := mocks.NewNotificationSender(t)
	settingsRepo := mocks.NewSettingsRepository(t)

	monitor := &domain.Monitor{ID: "m1", Name: "API"}
	ch := &domain.NotificationChannel{ID: "ch1", Type: domain.ChannelSlack, Enabled: true, Config: map[string]string{}}

	repo.On("GetChannelsForMonitor", mock.Anything, "m1").Return(
		[]domain.MonitorChannelAssignment{{Channel: ch}}, nil,
	)
	sender.On("Send", mock.Anything, ch, domain.EventDown, mock.Anything).Return(errors.New("fail"))
	repo.On("LogNotification", mock.Anything, mock.MatchedBy(func(l *domain.NotificationLog) bool {
		return l.Status == "failed"
	})).Return(nil)

	monitorRepo := mocks.NewMonitorRepository(t)
	monitorRepo.On("FindByID", mock.Anything, "m1").Return(monitor, nil)

	uc := usecase.NewNotificationUsecase(repo, sender, monitorRepo, settingsRepo)
	uc.Notify(context.Background(), "m1", domain.EventDown)

	repo.AssertCalled(t, "LogNotification", mock.Anything, mock.MatchedBy(func(l *domain.NotificationLog) bool {
		return l.Status == "failed"
	}))
}

var _ = require.New // prevent unused import

func TestNotify_CooldownActive_SkipsSend(t *testing.T) {
	repo := mocks.NewNotificationRepository(t)
	sender := mocks.NewNotificationSender(t)
	settingsRepo := mocks.NewSettingsRepository(t)
	monitorRepo := mocks.NewMonitorRepository(t)

	ch := &domain.NotificationChannel{ID: "ch1", Type: domain.ChannelEmail, Enabled: true, Config: map[string]string{}}
	triggers := domain.AssignmentTriggers{CooldownMinutes: 30}
	assignment := domain.MonitorChannelAssignment{Channel: ch, Triggers: triggers}

	repo.On("GetChannelsForMonitor", mock.Anything, "m1").Return([]domain.MonitorChannelAssignment{assignment}, nil)
	// LastSentAt returns 5 minutes ago — cooldown is 30 min, so skip
	repo.On("LastSentAt", mock.Anything, "m1", "ch1").Return(time.Now().Add(-5*time.Minute), nil)

	uc := usecase.NewNotificationUsecase(repo, sender, monitorRepo, settingsRepo)
	uc.Notify(context.Background(), "m1", domain.EventDown)

	sender.AssertNotCalled(t, "Send", mock.Anything, mock.Anything, mock.Anything, mock.Anything)
}

func TestNotify_CooldownExpired_Sends(t *testing.T) {
	repo := mocks.NewNotificationRepository(t)
	sender := mocks.NewNotificationSender(t)
	settingsRepo := mocks.NewSettingsRepository(t)
	monitorRepo := mocks.NewMonitorRepository(t)

	monitor := &domain.Monitor{ID: "m1", Name: "API"}
	ch := &domain.NotificationChannel{ID: "ch1", Type: domain.ChannelEmail, Enabled: true, Config: map[string]string{}}
	triggers := domain.AssignmentTriggers{CooldownMinutes: 30}
	assignment := domain.MonitorChannelAssignment{Channel: ch, Triggers: triggers}

	repo.On("GetChannelsForMonitor", mock.Anything, "m1").Return([]domain.MonitorChannelAssignment{assignment}, nil)
	repo.On("LastSentAt", mock.Anything, "m1", "ch1").Return(time.Now().Add(-2*time.Hour), nil)
	monitorRepo.On("FindByID", mock.Anything, "m1").Return(monitor, nil)
	sender.On("Send", mock.Anything, ch, domain.EventDown, mock.Anything).Return(nil)
	repo.On("LogNotification", mock.Anything, mock.Anything).Return(nil)

	uc := usecase.NewNotificationUsecase(repo, sender, monitorRepo, settingsRepo)
	uc.Notify(context.Background(), "m1", domain.EventDown)

	sender.AssertCalled(t, "Send", mock.Anything, ch, domain.EventDown, mock.Anything)
}

func TestNotify_NoCooldown_DoesNotCallLastSentAt(t *testing.T) {
	repo := mocks.NewNotificationRepository(t)
	sender := mocks.NewNotificationSender(t)
	settingsRepo := mocks.NewSettingsRepository(t)
	monitorRepo := mocks.NewMonitorRepository(t)

	monitor := &domain.Monitor{ID: "m1", Name: "API"}
	ch := &domain.NotificationChannel{ID: "ch1", Type: domain.ChannelEmail, Enabled: true, Config: map[string]string{}}
	// CooldownMinutes = 0 → skip LastSentAt entirely
	assignment := domain.MonitorChannelAssignment{Channel: ch}

	repo.On("GetChannelsForMonitor", mock.Anything, "m1").Return([]domain.MonitorChannelAssignment{assignment}, nil)
	monitorRepo.On("FindByID", mock.Anything, "m1").Return(monitor, nil)
	sender.On("Send", mock.Anything, ch, domain.EventDown, mock.Anything).Return(nil)
	repo.On("LogNotification", mock.Anything, mock.Anything).Return(nil)

	uc := usecase.NewNotificationUsecase(repo, sender, monitorRepo, settingsRepo)
	uc.Notify(context.Background(), "m1", domain.EventDown)

	repo.AssertNotCalled(t, "LastSentAt", mock.Anything, mock.Anything, mock.Anything)
	sender.AssertCalled(t, "Send", mock.Anything, ch, domain.EventDown, mock.Anything)
}

func TestNotify_GetGeneralFails_FailsOpen(t *testing.T) {
	repo := mocks.NewNotificationRepository(t)
	sender := mocks.NewNotificationSender(t)
	settingsRepo := mocks.NewSettingsRepository(t)
	monitorRepo := mocks.NewMonitorRepository(t)

	monitor := &domain.Monitor{ID: "m1", Name: "API"}
	ch := &domain.NotificationChannel{ID: "ch1", Type: domain.ChannelEmail, Enabled: true, Config: map[string]string{}}
	schedule := &domain.ScheduleRule{Days: []string{"mon"}, Start: "09:00", End: "18:00"}
	assignment := domain.MonitorChannelAssignment{Channel: ch, Triggers: domain.AssignmentTriggers{Schedule: schedule}}

	repo.On("GetChannelsForMonitor", mock.Anything, "m1").Return([]domain.MonitorChannelAssignment{assignment}, nil)
	settingsRepo.On("GetGeneral", mock.Anything).Return(nil, errors.New("db error"))
	monitorRepo.On("FindByID", mock.Anything, "m1").Return(monitor, nil)
	sender.On("Send", mock.Anything, ch, domain.EventDown, mock.Anything).Return(nil)
	repo.On("LogNotification", mock.Anything, mock.Anything).Return(nil)

	uc := usecase.NewNotificationUsecase(repo, sender, monitorRepo, settingsRepo)
	uc.Notify(context.Background(), "m1", domain.EventDown)

	sender.AssertCalled(t, "Send", mock.Anything, ch, domain.EventDown, mock.Anything)
}

func TestNotify_ScheduleMismatch_SkipsSend(t *testing.T) {
	repo := mocks.NewNotificationRepository(t)
	sender := mocks.NewNotificationSender(t)
	settingsRepo := mocks.NewSettingsRepository(t)

	ch := &domain.NotificationChannel{ID: "ch1", Type: domain.ChannelEmail, Enabled: true, Config: map[string]string{}}
	// Schedule that will never match: only on sun between 00:00-00:01
	schedule := &domain.ScheduleRule{Days: []string{"sun"}, Start: "00:00", End: "00:01"}
	assignment := domain.MonitorChannelAssignment{Channel: ch, Triggers: domain.AssignmentTriggers{Schedule: schedule}}

	repo.On("GetChannelsForMonitor", mock.Anything, "m1").Return([]domain.MonitorChannelAssignment{assignment}, nil)
	settingsRepo.On("GetGeneral", mock.Anything).Return(&domain.GeneralSettings{Timezone: "UTC"}, nil)

	uc := usecase.NewNotificationUsecase(repo, sender, mocks.NewMonitorRepository(t), settingsRepo)
	uc.Notify(context.Background(), "m1", domain.EventDown)

	sender.AssertNotCalled(t, "Send", mock.Anything, mock.Anything, mock.Anything, mock.Anything)
}

func TestNotify_InvalidTimezone_FailsOpen(t *testing.T) {
	repo := mocks.NewNotificationRepository(t)
	sender := mocks.NewNotificationSender(t)
	settingsRepo := mocks.NewSettingsRepository(t)
	monitorRepo := mocks.NewMonitorRepository(t)

	monitor := &domain.Monitor{ID: "m1", Name: "API"}
	ch := &domain.NotificationChannel{ID: "ch1", Type: domain.ChannelEmail, Enabled: true, Config: map[string]string{}}
	schedule := &domain.ScheduleRule{Days: []string{"mon"}, Start: "09:00", End: "18:00"}
	assignment := domain.MonitorChannelAssignment{Channel: ch, Triggers: domain.AssignmentTriggers{Schedule: schedule}}

	repo.On("GetChannelsForMonitor", mock.Anything, "m1").Return([]domain.MonitorChannelAssignment{assignment}, nil)
	settingsRepo.On("GetGeneral", mock.Anything).Return(&domain.GeneralSettings{Timezone: "Not/ATimezone"}, nil)
	monitorRepo.On("FindByID", mock.Anything, "m1").Return(monitor, nil)
	sender.On("Send", mock.Anything, ch, domain.EventDown, mock.Anything).Return(nil)
	repo.On("LogNotification", mock.Anything, mock.Anything).Return(nil)

	uc := usecase.NewNotificationUsecase(repo, sender, monitorRepo, settingsRepo)
	uc.Notify(context.Background(), "m1", domain.EventDown)

	sender.AssertCalled(t, "Send", mock.Anything, ch, domain.EventDown, mock.Anything)
}
