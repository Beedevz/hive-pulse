// Copyright (C) 2024 Beedevz. Licensed under AGPL v3 — see LICENSE for details.
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

const (
	incidentTable     = "incidents i"
	incidentJoin      = "LEFT JOIN monitors m ON m.id = i.monitor_id"
	incidentQFilter   = "COALESCE(m.name, i.monitor_name) ILIKE CONCAT('%', ?, '%')"
	incidentSelect    = "i.id, i.monitor_id, COALESCE(m.name, i.monitor_name) AS current_name, i.started_at, i.resolved_at, i.error_msg"
	incidentOrderDesc = "i.started_at DESC"
)

type incidentRow struct {
	ID          int64      `gorm:"column:id"`
	MonitorID   string     `gorm:"column:monitor_id"`
	CurrentName string     `gorm:"column:current_name"`
	StartedAt   time.Time  `gorm:"column:started_at"`
	ResolvedAt  *time.Time `gorm:"column:resolved_at"`
	ErrorMsg    string     `gorm:"column:error_msg"`
}

func mapIncidentRows(rows []incidentRow) []*domain.Incident {
	result := make([]*domain.Incident, len(rows))
	for i, r := range rows {
		result[i] = &domain.Incident{
			ID:          r.ID,
			MonitorID:   r.MonitorID,
			MonitorName: r.CurrentName,
			StartedAt:   r.StartedAt,
			ResolvedAt:  r.ResolvedAt,
			ErrorMsg:    r.ErrorMsg,
		}
	}
	return result
}

func incidentBaseQuery(db *gorm.DB, q string) *gorm.DB {
	tx := db.Table(incidentTable).Joins(incidentJoin)
	if q != "" {
		tx = tx.Where(incidentQFilter, q)
	}
	return tx
}

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

func (r *IncidentRepo) FindActive(ctx context.Context, q string, offset, limit int) ([]*domain.Incident, int, error) {
	base := incidentBaseQuery(r.db.WithContext(ctx), q).
		Where("i.resolved_at IS NULL")

	var total int64
	if err := base.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	var rows []incidentRow
	if err := base.
		Select(incidentSelect).
		Order(incidentOrderDesc).
		Offset(offset).
		Limit(limit).
		Scan(&rows).Error; err != nil {
		return nil, 0, err
	}
	return mapIncidentRows(rows), int(total), nil
}

func (r *IncidentRepo) FindRecent(ctx context.Context, q string, offset, limit int) ([]*domain.Incident, int, error) {
	base := incidentBaseQuery(r.db.WithContext(ctx), q)

	var total int64
	if err := base.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	var rows []incidentRow
	if err := base.
		Select(incidentSelect).
		Order(incidentOrderDesc).
		Offset(offset).
		Limit(limit).
		Scan(&rows).Error; err != nil {
		return nil, 0, err
	}
	return mapIncidentRows(rows), int(total), nil
}

func (r *IncidentRepo) FindResolved(ctx context.Context, q string, offset, limit int) ([]*domain.Incident, int, error) {
	base := incidentBaseQuery(r.db.WithContext(ctx), q).
		Where("i.resolved_at IS NOT NULL")

	var total int64
	if err := base.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	var rows []incidentRow
	if err := base.
		Select(incidentSelect).
		Order(incidentOrderDesc).
		Offset(offset).
		Limit(limit).
		Scan(&rows).Error; err != nil {
		return nil, 0, err
	}
	return mapIncidentRows(rows), int(total), nil
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

