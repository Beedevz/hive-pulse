//go:build integration

package repo_test

import (
	"context"
	"os"
	"path/filepath"
	"runtime"
	"testing"
	"time"

	"github.com/beedevz/hivepulse/infrastructure"
	"github.com/beedevz/hivepulse/internal/adapter/repo"
	"github.com/beedevz/hivepulse/internal/domain"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	tcpostgres "github.com/testcontainers/testcontainers-go/modules/postgres"
	"gorm.io/gorm"
)

func setupTestDB(t *testing.T) *gorm.DB {
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

	// Resolve the hivepulse-api root so RunMigrations can find file://migrations
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

func TestUserRepo_CreateAndFind(t *testing.T) {
	db := setupTestDB(t)
	r := repo.NewUserRepo(db)
	ctx := context.Background()

	user := &domain.User{Email: "test@example.com", Name: "Test", PasswordHash: "hash", Role: domain.RoleAdmin}
	require.NoError(t, r.Create(ctx, user))
	assert.NotEmpty(t, user.ID)

	found, err := r.FindByEmail(ctx, "test@example.com")
	require.NoError(t, err)
	assert.Equal(t, "Test", found.Name)

	count, err := r.Count(ctx)
	require.NoError(t, err)
	assert.Equal(t, int64(1), count)
}

func TestUserRepo_FindByID(t *testing.T) {
	db := setupTestDB(t)
	r := repo.NewUserRepo(db)
	ctx := context.Background()

	user := &domain.User{Email: "byid@example.com", Name: "ByID", PasswordHash: "hash", Role: domain.RoleViewer}
	require.NoError(t, r.Create(ctx, user))
	require.NotEmpty(t, user.ID)

	found, err := r.FindByID(ctx, user.ID)
	require.NoError(t, err)
	assert.Equal(t, "ByID", found.Name)
}

func TestUserRepo_FindByEmail_NotFound(t *testing.T) {
	db := setupTestDB(t)
	r := repo.NewUserRepo(db)
	ctx := context.Background()

	_, err := r.FindByEmail(ctx, "missing@example.com")
	assert.ErrorIs(t, err, domain.ErrNotFound)
}

func TestTokenRepo_CreateFindDelete(t *testing.T) {
	db := setupTestDB(t)
	ur := repo.NewUserRepo(db)
	tr := repo.NewTokenRepo(db)
	ctx := context.Background()

	user := &domain.User{Email: "token@example.com", Name: "Token", PasswordHash: "hash", Role: domain.RoleEditor}
	require.NoError(t, ur.Create(ctx, user))

	tok := &domain.RefreshToken{
		UserID:    user.ID,
		TokenHash: "sha256hashvalue",
		DeviceFP:  "fp123",
		IP:        "127.0.0.1",
		ExpiresAt: time.Now().Add(24 * time.Hour),
	}
	require.NoError(t, tr.Create(ctx, tok))

	found, err := tr.FindByHash(ctx, "sha256hashvalue")
	require.NoError(t, err)
	assert.Equal(t, user.ID, found.UserID)

	require.NoError(t, tr.DeleteByHash(ctx, "sha256hashvalue"))

	_, err = tr.FindByHash(ctx, "sha256hashvalue")
	assert.ErrorIs(t, err, domain.ErrNotFound)
}

func TestTokenRepo_DeleteExpired(t *testing.T) {
	db := setupTestDB(t)
	tr := repo.NewTokenRepo(db)
	ctx := context.Background()

	require.NoError(t, tr.DeleteExpired(ctx))
}

func TestMonitorRepo_UpdateLastStatus(t *testing.T) {
	db := setupTestDB(t)
	r := repo.NewMonitorRepo(db)
	ctx := context.Background()

	userRepo := repo.NewUserRepo(db)
	user := &domain.User{Email: "u@ex.com", Name: "U", PasswordHash: "h", Role: domain.RoleAdmin}
	require.NoError(t, userRepo.Create(ctx, user))

	m := &domain.Monitor{
		UserID: user.ID, Name: "Mon", CheckType: domain.CheckHTTP,
		Interval: 60, Timeout: 10, Enabled: true,
	}
	require.NoError(t, r.Create(ctx, m))

	require.NoError(t, r.UpdateLastStatus(ctx, m.ID, "down"))

	found, err := r.FindByID(ctx, m.ID)
	require.NoError(t, err)
	assert.Equal(t, "down", found.LastStatus)
}

func setupMonitorForIncidentTest(t *testing.T, db *gorm.DB) (*domain.Monitor, string) {
	t.Helper()
	ctx := context.Background()
	userRepo := repo.NewUserRepo(db)
	user := &domain.User{Email: "inc@ex.com", Name: "Inc", PasswordHash: "h", Role: domain.RoleAdmin}
	require.NoError(t, userRepo.Create(ctx, user))
	monitorRepo := repo.NewMonitorRepo(db)
	m := &domain.Monitor{
		UserID: user.ID, Name: "Inc Monitor", CheckType: domain.CheckHTTP,
		Interval: 60, Timeout: 10, Enabled: true,
	}
	require.NoError(t, monitorRepo.Create(ctx, m))
	return m, m.ID
}

func TestIncidentRepo_CreateAndFindActive(t *testing.T) {
	db := setupTestDB(t)
	r := repo.NewIncidentRepo(db)
	ctx := context.Background()
	m, monitorID := setupMonitorForIncidentTest(t, db)

	inc := &domain.Incident{
		MonitorID:   monitorID,
		MonitorName: m.Name,
		StartedAt:   time.Now(),
		ErrorMsg:    "connection refused",
	}
	require.NoError(t, r.Create(ctx, inc))
	assert.NotZero(t, inc.ID)

	active, err := r.FindActive(ctx)
	require.NoError(t, err)
	require.Len(t, active, 1)
	assert.Equal(t, monitorID, active[0].MonitorID)
	assert.Nil(t, active[0].ResolvedAt)
}

func TestIncidentRepo_Resolve(t *testing.T) {
	db := setupTestDB(t)
	r := repo.NewIncidentRepo(db)
	ctx := context.Background()
	m, monitorID := setupMonitorForIncidentTest(t, db)

	inc := &domain.Incident{MonitorID: monitorID, MonitorName: m.Name, StartedAt: time.Now()}
	require.NoError(t, r.Create(ctx, inc))

	resolvedAt := time.Now().Add(5 * time.Minute)
	require.NoError(t, r.Resolve(ctx, monitorID, resolvedAt))

	active, err := r.FindActive(ctx)
	require.NoError(t, err)
	assert.Empty(t, active)

	resolved, err := r.FindResolved(ctx, 10)
	require.NoError(t, err)
	require.Len(t, resolved, 1)
	assert.NotNil(t, resolved[0].ResolvedAt)
}

func TestIncidentRepo_Resolve_Idempotent(t *testing.T) {
	db := setupTestDB(t)
	r := repo.NewIncidentRepo(db)
	ctx := context.Background()
	_, monitorID := setupMonitorForIncidentTest(t, db)

	// No open incident — should be no-op, no error
	err := r.Resolve(ctx, monitorID, time.Now())
	assert.NoError(t, err)
}

func TestIncidentRepo_FindRecent(t *testing.T) {
	db := setupTestDB(t)
	r := repo.NewIncidentRepo(db)
	ctx := context.Background()
	m, monitorID := setupMonitorForIncidentTest(t, db)

	for i := 0; i < 3; i++ {
		inc := &domain.Incident{
			MonitorID: monitorID, MonitorName: m.Name,
			StartedAt: time.Now().Add(time.Duration(i) * time.Minute),
		}
		require.NoError(t, r.Create(ctx, inc))
		if i < 2 {
			require.NoError(t, r.Resolve(ctx, monitorID, time.Now().Add(time.Duration(i)*time.Minute+time.Second)))
		}
	}

	recent, err := r.FindRecent(ctx, 10)
	require.NoError(t, err)
	assert.Len(t, recent, 3)
}

func TestIncidentRepo_FindByMonitorAndTimeRange(t *testing.T) {
	db := setupTestDB(t)
	r := repo.NewIncidentRepo(db)
	ctx := context.Background()

	userRepo := repo.NewUserRepo(db)
	user := &domain.User{Email: "rangetest@example.com", Name: "RangeTest", PasswordHash: "h", Role: domain.RoleAdmin}
	require.NoError(t, userRepo.Create(ctx, user))

	monitorRepo := repo.NewMonitorRepo(db)
	m := &domain.Monitor{UserID: user.ID, Name: "RangeMon", CheckType: domain.CheckHTTP, Interval: 60, Timeout: 10, Enabled: true}
	require.NoError(t, monitorRepo.Create(ctx, m))

	since := time.Now().Add(-2 * time.Hour)
	// incident within range
	inc1 := &domain.Incident{MonitorID: m.ID, MonitorName: "RangeMon", StartedAt: time.Now().Add(-1 * time.Hour)}
	require.NoError(t, r.Create(ctx, inc1))
	// incident before range (should be excluded)
	inc2 := &domain.Incident{MonitorID: m.ID, MonitorName: "RangeMon", StartedAt: time.Now().Add(-3 * time.Hour)}
	require.NoError(t, r.Create(ctx, inc2))

	results, err := r.FindByMonitorAndTimeRange(ctx, m.ID, since)
	require.NoError(t, err)
	require.Len(t, results, 1)
	assert.Equal(t, inc1.StartedAt.Unix(), results[0].StartedAt.Unix())
}
