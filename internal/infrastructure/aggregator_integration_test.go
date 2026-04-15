//go:build integration

package infrastructure_test

import (
	"context"
	"os"
	"path/filepath"
	"runtime"
	"testing"
	"time"

	"github.com/beedevz/hivepulse/infrastructure"
	infra "github.com/beedevz/hivepulse/internal/infrastructure"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	tcpostgres "github.com/testcontainers/testcontainers-go/modules/postgres"
	"gorm.io/gorm"
)

func setupAggregatorTestDB(t *testing.T) *gorm.DB {
	t.Helper()
	ctx := context.Background()
	container, err := tcpostgres.RunContainer(ctx,
		tcpostgres.WithDatabase("hivepulse_test"),
		tcpostgres.WithUsername("test"),
		tcpostgres.WithPassword("test"),
		tcpostgres.BasicWaitStrategies(),
	)
	require.NoError(t, err)
	t.Cleanup(func() { container.Terminate(ctx) })

	_, callerFile, _, _ := runtime.Caller(0)
	apiRoot := filepath.Join(filepath.Dir(callerFile), "..", "..", "..")
	orig, _ := os.Getwd()
	require.NoError(t, os.Chdir(apiRoot))
	t.Cleanup(func() { os.Chdir(orig) })

	dsn, _ := container.ConnectionString(ctx, "sslmode=disable")
	db := infrastructure.NewDatabase(dsn)
	infrastructure.RunMigrations(dsn)
	return db
}

func TestAggregator_Tick_PopulatesStats(t *testing.T) {
	db := setupAggregatorTestDB(t)
	ctx := context.Background()

	// Insert a user
	userID := uuid.New().String()
	require.NoError(t, db.WithContext(ctx).Exec(`
		INSERT INTO users (id, name, email, password_hash, role, created_at)
		VALUES (?, ?, ?, ?, 'admin', ?)
	`, userID, "Test User", "test@example.com", "hash", time.Now()).Error)

	// Insert a monitor
	monitorID := uuid.New().String()
	require.NoError(t, db.WithContext(ctx).Exec(`
		INSERT INTO monitors (id, user_id, name, check_type, interval, timeout, enabled, created_at, updated_at)
		VALUES (?, ?, ?, 'http', 60, 30, true, ?, ?)
	`, monitorID, userID, "Test Monitor", time.Now(), time.Now()).Error)

	// Insert 3 heartbeat rows
	now := time.Now()
	require.NoError(t, db.WithContext(ctx).Exec(`
		INSERT INTO heartbeats (monitor_id, status, ping_ms, checked_at)
		VALUES (?, 'up', 100, ?), (?, 'up', 200, ?), (?, 'down', 150, ?)
	`, monitorID, now, monitorID, now, monitorID, now).Error)

	t.Cleanup(func() {
		db.Exec(`TRUNCATE heartbeats, stats_hourly, stats_daily, monitors, users CASCADE`)
	})

	agg := infra.NewAggregator(db)
	require.NoError(t, agg.Tick(ctx))

	// Assert stats_hourly has 1 row with correct counts
	var hourlyUpCount, hourlyTotalCount, hourlyAvgPing int
	row := db.WithContext(ctx).Raw(`
		SELECT up_count, total_count, avg_ping_ms FROM stats_hourly WHERE monitor_id = ?
	`, monitorID).Row()
	require.NoError(t, row.Scan(&hourlyUpCount, &hourlyTotalCount, &hourlyAvgPing))
	assert.Equal(t, 2, hourlyUpCount)
	assert.Equal(t, 3, hourlyTotalCount)
	assert.GreaterOrEqual(t, hourlyAvgPing, 100)
	assert.LessOrEqual(t, hourlyAvgPing, 200)

	// Assert stats_daily has 1 row with correct counts
	var dailyUpCount, dailyTotalCount int
	row = db.WithContext(ctx).Raw(`
		SELECT up_count, total_count FROM stats_daily WHERE monitor_id = ?
	`, monitorID).Row()
	require.NoError(t, row.Scan(&dailyUpCount, &dailyTotalCount))
	assert.Equal(t, 2, dailyUpCount)
	assert.Equal(t, 3, dailyTotalCount)
}
