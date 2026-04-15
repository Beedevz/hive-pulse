// Copyright (C) 2024 Beedevz. Licensed under AGPL v3 — see LICENSE for details.
//go:build integration

package repo_test

import (
	"context"
	"testing"
	"time"

	"github.com/beedevz/hivepulse/internal/adapter/repo"
	"github.com/beedevz/hivepulse/internal/domain"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestStatsRepo_GetMinutely(t *testing.T) {
	db := setupTestDB(t)
	statsRepo := repo.NewStatsRepo(db)
	userRepo := repo.NewUserRepo(db)
	monitorRepo := repo.NewMonitorRepo(db)
	ctx := context.Background()

	user := &domain.User{Email: "minutely@example.com", Name: "MinutelyTest", PasswordHash: "h", Role: domain.RoleAdmin}
	require.NoError(t, userRepo.Create(ctx, user))

	m := &domain.Monitor{UserID: user.ID, Name: "MinMon", CheckType: domain.CheckHTTP, Interval: 60, Timeout: 10, Enabled: true}
	require.NoError(t, monitorRepo.Create(ctx, m))

	now := time.Now().UTC().Truncate(time.Minute)
	// Insert two rows directly — aggregator not running in tests
	require.NoError(t, db.Exec(
		`INSERT INTO stats_minutely (monitor_id, minute, up_count, total_count, avg_ping_ms) VALUES (?, ?, 1, 1, 50)`,
		m.ID, now.Add(-2*time.Minute),
	).Error)
	require.NoError(t, db.Exec(
		`INSERT INTO stats_minutely (monitor_id, minute, up_count, total_count, avg_ping_ms) VALUES (?, ?, 1, 1, 55)`,
		m.ID, now.Add(-1*time.Minute),
	).Error)
	// Row outside the range — should be excluded
	require.NoError(t, db.Exec(
		`INSERT INTO stats_minutely (monitor_id, minute, up_count, total_count, avg_ping_ms) VALUES (?, ?, 1, 1, 60)`,
		m.ID, now.Add(-10*time.Minute),
	).Error)

	since := now.Add(-5 * time.Minute)
	buckets, err := statsRepo.GetMinutely(ctx, m.ID, since)
	require.NoError(t, err)
	assert.Len(t, buckets, 2)
	assert.Equal(t, 50, buckets[0].AvgPingMS)
	assert.Equal(t, 55, buckets[1].AvgPingMS)
}
