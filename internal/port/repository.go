package port

import (
	"context"
	"time"

	"github.com/beedevz/hivepulse/internal/domain"
)

type UserRepository interface {
	Create(ctx context.Context, user *domain.User) error
	FindByEmail(ctx context.Context, email string) (*domain.User, error)
	FindByID(ctx context.Context, id string) (*domain.User, error)
	Count(ctx context.Context) (int64, error)
	List(ctx context.Context, page, limit int) ([]*domain.User, int64, error)
	UpdateRole(ctx context.Context, id string, role domain.Role) error
	Delete(ctx context.Context, id string) error
}

type TokenRepository interface {
	Create(ctx context.Context, token *domain.RefreshToken) error
	FindByHash(ctx context.Context, hash string) (*domain.RefreshToken, error)
	DeleteByHash(ctx context.Context, hash string) error
	DeleteExpired(ctx context.Context) error
}

type MonitorRepository interface {
	Create(ctx context.Context, m *domain.Monitor) error
	FindByID(ctx context.Context, id string) (*domain.Monitor, error)
	FindAll(ctx context.Context, page, limit int) ([]*domain.Monitor, int64, error)
	Update(ctx context.Context, m *domain.Monitor) error
	Delete(ctx context.Context, id string) error
	FindAllEnabled(ctx context.Context) ([]*domain.Monitor, error)
	UpdateLastStatus(ctx context.Context, monitorID string, status string) error
	AssignTag(ctx context.Context, monitorID, tagID string) error
	UnassignTag(ctx context.Context, monitorID, tagID string) error
	FindTagsByMonitor(ctx context.Context, monitorID string) ([]*domain.Tag, error)
	FindByTagIDs(ctx context.Context, tagIDs []string) ([]*domain.Monitor, error)
}

type HeartbeatRepository interface {
	Create(ctx context.Context, h *domain.Heartbeat) error
	FindLatest(ctx context.Context, monitorID string, limit int) ([]*domain.Heartbeat, error)
	GetUptime(ctx context.Context, monitorID string, since time.Time) (int64, int64, error) // up, total
}

type IncidentRepository interface {
	Create(ctx context.Context, incident *domain.Incident) error
	// Resolve sets resolved_at for the open incident for monitorID.
	// Idempotent: if no open incident exists, this is a no-op (no error).
	Resolve(ctx context.Context, monitorID string, resolvedAt time.Time) error
	// FindActive returns all open incidents matching q (monitor name ILIKE), up to limit, with total count.
	FindActive(ctx context.Context, q string, offset, limit int) ([]*domain.Incident, int, error)
	// FindRecent returns the last limit incidents regardless of status, filtered by q, with total count.
	FindRecent(ctx context.Context, q string, offset, limit int) ([]*domain.Incident, int, error)
	// FindResolved returns resolved incidents filtered by q, with offset/limit pagination and total count.
	FindResolved(ctx context.Context, q string, offset, limit int) ([]*domain.Incident, int, error)
	// FindByMonitorAndTimeRange returns all incidents for monitorID that started at or after since,
	// ordered by started_at ASC. Includes active (unresolved) incidents.
	FindByMonitorAndTimeRange(ctx context.Context, monitorID string, since time.Time) ([]*domain.Incident, error)
}

type StatsRepository interface {
	GetMinutely(ctx context.Context, monitorID string, since time.Time) ([]*domain.StatsBucket, error)
	GetHourly(ctx context.Context, monitorID string, since time.Time) ([]*domain.StatsBucket, error)
	GetDaily(ctx context.Context, monitorID string, since time.Time) ([]*domain.StatsBucket, error)
	GetGlobalHourly(ctx context.Context, since time.Time) ([]*domain.StatsBucket, error)
}

type MaintenanceWindowRepository interface {
	Create(ctx context.Context, mw *domain.MaintenanceWindow) error
	Delete(ctx context.Context, id string) error
	FindByMonitor(ctx context.Context, monitorID string) ([]*domain.MaintenanceWindow, error)
	FindGlobal(ctx context.Context) ([]*domain.MaintenanceWindow, error)
	IsMonitorInMaintenance(ctx context.Context, monitorID string, at time.Time) (bool, error)
	DeleteExpiredBefore(ctx context.Context, before time.Time) (int64, error)
}
