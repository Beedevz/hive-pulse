package repo

import (
	"context"
	"time"

	"github.com/beedevz/hivepulse/internal/domain"
	"github.com/beedevz/hivepulse/internal/port"
	"gorm.io/gorm"
)

type heartbeatModel struct {
	ID         int64  `gorm:"primaryKey;autoIncrement"`
	MonitorID  string `gorm:"type:uuid;not null"`
	Status     string
	PingMS     int
	StatusCode int
	ErrorMsg   string
	CheckedAt  time.Time
}

func (heartbeatModel) TableName() string { return "heartbeats" }

type HeartbeatRepo struct{ db *gorm.DB }

func NewHeartbeatRepo(db *gorm.DB) port.HeartbeatRepository { return &HeartbeatRepo{db} }

func (r *HeartbeatRepo) Create(ctx context.Context, h *domain.Heartbeat) error {
	m := &heartbeatModel{
		MonitorID:  h.MonitorID,
		Status:     h.Status,
		PingMS:     h.PingMS,
		StatusCode: h.StatusCode,
		ErrorMsg:   h.ErrorMsg,
		CheckedAt:  h.CheckedAt,
	}
	if err := r.db.WithContext(ctx).Create(m).Error; err != nil {
		return err
	}
	h.ID = m.ID
	return nil
}

func (r *HeartbeatRepo) FindLatest(ctx context.Context, monitorID string, limit int) ([]*domain.Heartbeat, error) {
	var models []heartbeatModel
	if err := r.db.WithContext(ctx).
		Where("monitor_id = ?", monitorID).
		Order("checked_at DESC").
		Limit(limit).
		Find(&models).Error; err != nil {
		return nil, err
	}
	result := make([]*domain.Heartbeat, len(models))
	for i, m := range models {
		result[i] = &domain.Heartbeat{
			ID:         m.ID,
			MonitorID:  m.MonitorID,
			Status:     m.Status,
			PingMS:     m.PingMS,
			StatusCode: m.StatusCode,
			ErrorMsg:   m.ErrorMsg,
			CheckedAt:  m.CheckedAt,
		}
	}
	return result, nil
}

func (r *HeartbeatRepo) GetUptime(ctx context.Context, monitorID string, since time.Time) (int64, int64, error) {
	var total int64
	if err := r.db.WithContext(ctx).Model(&heartbeatModel{}).
		Where("monitor_id = ? AND checked_at >= ?", monitorID, since).
		Count(&total).Error; err != nil {
		return 0, 0, err
	}
	var up int64
	if err := r.db.WithContext(ctx).Model(&heartbeatModel{}).
		Where("monitor_id = ? AND checked_at >= ? AND status = 'up'", monitorID, since).
		Count(&up).Error; err != nil {
		return 0, 0, err
	}
	return up, total, nil
}
