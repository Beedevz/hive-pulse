// hivepulse-api/internal/adapter/repo/incident_repo.go
package repo

import (
	"context"
	"time"

	"github.com/beedevz/hivepulse/internal/domain"
	"github.com/beedevz/hivepulse/internal/port"
	"gorm.io/gorm"
)

type incidentModel struct {
	ID          int64      `gorm:"primaryKey;autoIncrement"`
	MonitorID   string     `gorm:"type:uuid;not null"`
	MonitorName string     `gorm:"not null"`
	StartedAt   time.Time  `gorm:"not null"`
	ResolvedAt  *time.Time `gorm:"default:null"`
	ErrorMsg    string
}

func (incidentModel) TableName() string { return "incidents" }

type IncidentRepo struct{ db *gorm.DB }

func NewIncidentRepo(db *gorm.DB) port.IncidentRepository { return &IncidentRepo{db} }

func (r *IncidentRepo) Create(ctx context.Context, inc *domain.Incident) error {
	m := &incidentModel{
		MonitorID:   inc.MonitorID,
		MonitorName: inc.MonitorName,
		StartedAt:   inc.StartedAt,
		ErrorMsg:    inc.ErrorMsg,
	}
	if err := r.db.WithContext(ctx).Create(m).Error; err != nil {
		return err
	}
	inc.ID = m.ID
	return nil
}

func (r *IncidentRepo) Resolve(ctx context.Context, monitorID string, resolvedAt time.Time) error {
	return r.db.WithContext(ctx).Model(&incidentModel{}).
		Where("monitor_id = ? AND resolved_at IS NULL", monitorID).
		Update("resolved_at", resolvedAt).Error
}

func (r *IncidentRepo) FindActive(ctx context.Context) ([]*domain.Incident, error) {
	type activeRow struct {
		ID          int64      `gorm:"column:id"`
		MonitorID   string     `gorm:"column:monitor_id"`
		CurrentName string     `gorm:"column:current_name"`
		StartedAt   time.Time  `gorm:"column:started_at"`
		ResolvedAt  *time.Time `gorm:"column:resolved_at"`
		ErrorMsg    string     `gorm:"column:error_msg"`
	}
	var rows []activeRow
	if err := r.db.WithContext(ctx).
		Table("incidents i").
		Select("i.id, i.monitor_id, COALESCE(m.name, i.monitor_name) AS current_name, i.started_at, i.resolved_at, i.error_msg").
		Joins("LEFT JOIN monitors m ON m.id = i.monitor_id").
		Where("i.resolved_at IS NULL").
		Order("i.started_at DESC").
		Scan(&rows).Error; err != nil {
		return nil, err
	}
	result := make([]*domain.Incident, len(rows))
	for i, row := range rows {
		result[i] = &domain.Incident{
			ID:          row.ID,
			MonitorID:   row.MonitorID,
			MonitorName: row.CurrentName,
			StartedAt:   row.StartedAt,
			ResolvedAt:  row.ResolvedAt,
			ErrorMsg:    row.ErrorMsg,
		}
	}
	return result, nil
}

func (r *IncidentRepo) FindRecent(ctx context.Context, limit int) ([]*domain.Incident, error) {
	var models []incidentModel
	if err := r.db.WithContext(ctx).
		Order("started_at DESC").
		Limit(limit).
		Find(&models).Error; err != nil {
		return nil, err
	}
	return toIncidentSlice(models), nil
}

func (r *IncidentRepo) FindResolved(ctx context.Context, limit int) ([]*domain.Incident, error) {
	var models []incidentModel
	if err := r.db.WithContext(ctx).
		Where("resolved_at IS NOT NULL").
		Order("resolved_at DESC").
		Limit(limit).
		Find(&models).Error; err != nil {
		return nil, err
	}
	return toIncidentSlice(models), nil
}

func (r *IncidentRepo) FindByMonitorAndTimeRange(ctx context.Context, monitorID string, since time.Time) ([]*domain.Incident, error) {
	type row struct {
		ID         int64      `gorm:"column:id"`
		MonitorID  string     `gorm:"column:monitor_id"`
		StartedAt  time.Time  `gorm:"column:started_at"`
		ResolvedAt *time.Time `gorm:"column:resolved_at"`
		ErrorMsg   string     `gorm:"column:error_msg"`
	}
	var rows []row
	if err := r.db.WithContext(ctx).Raw(`
		SELECT id, monitor_id, started_at, resolved_at, error_msg
		FROM incidents
		WHERE monitor_id = ? AND started_at >= ?
		ORDER BY started_at ASC`,
		monitorID, since,
	).Scan(&rows).Error; err != nil {
		return nil, err
	}
	result := make([]*domain.Incident, len(rows))
	for i, rw := range rows {
		result[i] = &domain.Incident{
			ID:         rw.ID,
			MonitorID:  rw.MonitorID,
			StartedAt:  rw.StartedAt,
			ResolvedAt: rw.ResolvedAt,
			ErrorMsg:   rw.ErrorMsg,
		}
	}
	return result, nil
}

func toIncidentSlice(models []incidentModel) []*domain.Incident {
	result := make([]*domain.Incident, len(models))
	for i, m := range models {
		result[i] = &domain.Incident{
			ID:          m.ID,
			MonitorID:   m.MonitorID,
			MonitorName: m.MonitorName,
			StartedAt:   m.StartedAt,
			ResolvedAt:  m.ResolvedAt,
			ErrorMsg:    m.ErrorMsg,
		}
	}
	return result
}
