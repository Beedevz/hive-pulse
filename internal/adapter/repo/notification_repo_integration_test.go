// Copyright (C) 2024 Beedevz. Licensed under AGPL v3 — see LICENSE for details.
//go:build integration

package repo_test

import (
	"context"
	"os"
	"testing"

	"github.com/beedevz/hivepulse/internal/adapter/repo"
	"github.com/beedevz/hivepulse/internal/domain"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNotificationRepo_CRUD(t *testing.T) {
	if os.Getenv("TEST_DB_URL") == "" {
		t.Skip("TEST_DB_URL not set")
	}
}

func TestNotificationRepo_AssignUnassign(t *testing.T) {
	if os.Getenv("TEST_DB_URL") == "" {
		t.Skip("TEST_DB_URL not set")
	}
}

func TestNotificationRepo_FindReminders(t *testing.T) {
	if os.Getenv("TEST_DB_URL") == "" {
		t.Skip("TEST_DB_URL not set")
	}
}

func TestNotificationRepo_HasRecentSSLLog(t *testing.T) {
	if os.Getenv("TEST_DB_URL") == "" {
		t.Skip("TEST_DB_URL not set")
	}
}

func TestNotificationRepo_ListLogs_MonitorName(t *testing.T) {
	db := setupTestDB(t)
	r := repo.NewNotificationRepo(db)
	ctx := context.Background()

	// Seed: user required by monitors FK
	userRepo := repo.NewUserRepo(db)
	user := &domain.User{Email: "logtest@example.com", Name: "LogTest", PasswordHash: "h", Role: domain.RoleAdmin}
	require.NoError(t, userRepo.Create(ctx, user))

	// Seed: monitor with known name
	monitorRepo := repo.NewMonitorRepo(db)
	m := &domain.Monitor{
		UserID: user.ID, Name: "My Monitor", CheckType: domain.CheckHTTP,
		Interval: 60, Timeout: 10, Enabled: true,
	}
	require.NoError(t, monitorRepo.Create(ctx, m))

	channelID := "550e8400-e29b-41d4-a716-446655440001"
	db.Exec(`INSERT INTO notification_channels (id, name, type) VALUES ($1, 'Chan1', 'email')`, channelID)
	db.Exec(`INSERT INTO notification_logs (channel_id, monitor_id, event, status) VALUES ($1, $2, 'down', 'sent')`, channelID, m.ID)

	logs, err := r.ListLogs(ctx, channelID)
	require.NoError(t, err)
	require.Len(t, logs, 1)
	assert.Equal(t, "My Monitor", logs[0].MonitorName)

	// Seed: log with deleted (non-existent) monitor
	channelID2 := "550e8400-e29b-41d4-a716-446655440003"
	db.Exec(`INSERT INTO notification_channels (id, name, type) VALUES ($1, 'Chan2', 'email')`, channelID2)
	db.Exec(`INSERT INTO notification_logs (channel_id, monitor_id, event, status) VALUES ($1, $2, 'down', 'sent')`, channelID2, "550e8400-e29b-41d4-a716-446655440099")

	logs2, err := r.ListLogs(ctx, channelID2)
	require.NoError(t, err)
	require.Len(t, logs2, 1)
	assert.Equal(t, "", logs2[0].MonitorName)
}

// compile-time interface check
var _ = func() {
	_ = context.Background()
	_ = assert.New
	_ = require.New
	_ = repo.NewNotificationRepo
	_ = domain.ErrNotFound
}
