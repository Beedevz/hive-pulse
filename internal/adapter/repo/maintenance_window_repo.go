// Copyright (C) 2024 Beedevz. Licensed under AGPL v3 — see LICENSE for details.
package repo

import (
	"context"
	"time"

	"github.com/beedevz/hivepulse/internal/domain"
	"github.com/beedevz/hivepulse/internal/port"
	"gorm.io/gorm"
)

type mwModel struct {
	ID        string    `gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	MonitorID *string   `gorm:"type:uuid"`
	StartsAt  time.Time `gorm:"not null"`
	EndsAt    time.Time `gorm:"not null"`
	Reason    string    `gorm:"not null;default:''"`
	CreatedAt time.Time `gorm:"not null;default:now()"`
}

func (mwModel) TableName() string { return "maintenance_windows" }

type MaintenanceWindowRepo struct{ db *gorm.DB }

func NewMaintenanceWindowRepo(db *gorm.DB) port.MaintenanceWindowRepository {
	return &MaintenanceWindowRepo{db}
}

func (r *MaintenanceWindowRepo) Create(ctx context.Context, mw *domain.MaintenanceWindow) error {
	m := &mwModel{
		MonitorID: mw.MonitorID,
		StartsAt:  mw.StartsAt,
		EndsAt:    mw.EndsAt,
		Reason:    mw.Reason,
	}
	if err := r.db.WithContext(ctx).Create(m).Error; err != nil {
		return err
	}
	mw.ID = m.ID
	mw.CreatedAt = m.CreatedAt
	return nil
}

func (r *MaintenanceWindowRepo) Delete(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).Delete(&mwModel{}, "id = ?", id).Error
}

func (r *MaintenanceWindowRepo) FindByMonitor(ctx context.Context, monitorID string) ([]*domain.MaintenanceWindow, error) {
	var models []mwModel
	if err := r.db.WithContext(ctx).
		Where("monitor_id = ?", monitorID).
		Order("starts_at DESC").
		Find(&models).Error; err != nil {
		return nil, err
	}
	return toMWSlice(models), nil
}

func (r *MaintenanceWindowRepo) FindGlobal(ctx context.Context) ([]*domain.MaintenanceWindow, error) {
	var models []mwModel
	if err := r.db.WithContext(ctx).
		Where("monitor_id IS NULL").
		Order("starts_at DESC").
		Find(&models).Error; err != nil {
		return nil, err
	}
	return toMWSlice(models), nil
}

func (r *MaintenanceWindowRepo) IsMonitorInMaintenance(ctx context.Context, monitorID string, at time.Time) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&mwModel{}).
		Where("(monitor_id = ? OR monitor_id IS NULL) AND starts_at <= ? AND ends_at > ?", monitorID, at, at).
		Count(&count).Error
	return count > 0, err
}

func (r *MaintenanceWindowRepo) DeleteExpiredBefore(ctx context.Context, before time.Time) (int64, error) {
	result := r.db.WithContext(ctx).Where("ends_at < ?", before).Delete(&mwModel{})
	return result.RowsAffected, result.Error
}

func toMWSlice(models []mwModel) []*domain.MaintenanceWindow {
	result := make([]*domain.MaintenanceWindow, len(models))
	for i, m := range models {
		result[i] = &domain.MaintenanceWindow{
			ID:        m.ID,
			MonitorID: m.MonitorID,
			StartsAt:  m.StartsAt,
			EndsAt:    m.EndsAt,
			Reason:    m.Reason,
			CreatedAt: m.CreatedAt,
		}
	}
	return result
}
