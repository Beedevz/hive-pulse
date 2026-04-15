// Copyright (C) 2024 Beedevz. Licensed under AGPL v3 — see LICENSE for details.
package repo

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/beedevz/hivepulse/internal/domain"
	"github.com/beedevz/hivepulse/internal/port"
	"gorm.io/gorm"
)

type notificationChannelModel struct {
	ID                string `gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Name              string
	Type              string
	Config            []byte `gorm:"type:jsonb"`
	IsGlobal          bool
	Enabled           bool
	RemindIntervalMin int
	CreatedAt         time.Time
	UpdatedAt         time.Time
}

func (notificationChannelModel) TableName() string { return "notification_channels" }

type NotificationRepo struct{ db *gorm.DB }

func NewNotificationRepo(db *gorm.DB) port.NotificationRepository {
	return &NotificationRepo{db}
}

func (r *NotificationRepo) CreateChannel(ctx context.Context, ch *domain.NotificationChannel) error {
	configBytes, err := json.Marshal(ch.Config)
	if err != nil {
		return err
	}
	row := r.db.WithContext(ctx).Raw(
		`INSERT INTO notification_channels (name, type, config, is_global, enabled, remind_interval_min)
		 VALUES (?, ?, ?::jsonb, ?, ?, ?)
		 RETURNING id, created_at, updated_at`,
		ch.Name, string(ch.Type), string(configBytes), ch.IsGlobal, ch.Enabled, ch.RemindIntervalMin,
	).Row()
	return row.Scan(&ch.ID, &ch.CreatedAt, &ch.UpdatedAt)
}

func (r *NotificationRepo) UpdateChannel(ctx context.Context, ch *domain.NotificationChannel) error {
	configBytes, err := json.Marshal(ch.Config)
	if err != nil {
		return err
	}
	result := r.db.WithContext(ctx).Exec(
		`UPDATE notification_channels
		 SET name = ?, type = ?, config = config || ?::jsonb, is_global = ?, enabled = ?, remind_interval_min = ?, updated_at = NOW()
		 WHERE id = ?`,
		ch.Name, string(ch.Type), string(configBytes), ch.IsGlobal, ch.Enabled, ch.RemindIntervalMin, ch.ID,
	)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return domain.ErrNotFound
	}
	return nil
}

func (r *NotificationRepo) DeleteChannel(ctx context.Context, id string) error {
	result := r.db.WithContext(ctx).Exec(`DELETE FROM notification_channels WHERE id = ?`, id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return domain.ErrNotFound
	}
	return nil
}

func (r *NotificationRepo) ListChannels(ctx context.Context) ([]*domain.NotificationChannel, error) {
	var rows []notificationChannelModel
	if err := r.db.WithContext(ctx).Order("created_at ASC").Find(&rows).Error; err != nil {
		return nil, err
	}
	result := make([]*domain.NotificationChannel, len(rows))
	for i := range rows {
		ch, err := toDomainChannel(&rows[i])
		if err != nil {
			return nil, err
		}
		result[i] = ch
	}
	return result, nil
}

func (r *NotificationRepo) GetChannel(ctx context.Context, id string) (*domain.NotificationChannel, error) {
	var m notificationChannelModel
	if err := r.db.WithContext(ctx).First(&m, "id = ?", id).Error; err != nil {
		if isNotFound(err) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}
	return toDomainChannel(&m)
}

type monitorChannelRow struct {
	// notification_channels columns
	ID                string    `gorm:"column:id"`
	Name              string    `gorm:"column:name"`
	Type              string    `gorm:"column:type"`
	Config            []byte    `gorm:"column:config"`
	IsGlobal          bool      `gorm:"column:is_global"`
	Enabled           bool      `gorm:"column:enabled"`
	RemindIntervalMin int       `gorm:"column:remind_interval_min"`
	CreatedAt         time.Time `gorm:"column:created_at"`
	UpdatedAt         time.Time `gorm:"column:updated_at"`
	// junction column
	Triggers []byte `gorm:"column:triggers"`
}

func (r *NotificationRepo) GetChannelsForMonitor(ctx context.Context, monitorID string) ([]domain.MonitorChannelAssignment, error) {
	var rows []monitorChannelRow
	err := r.db.WithContext(ctx).Raw(
		`SELECT nc.*, mnc.triggers FROM notification_channels nc
		 JOIN monitor_notification_channels mnc ON mnc.channel_id = nc.id
		 WHERE mnc.monitor_id = ? AND nc.enabled = true`,
		monitorID,
	).Scan(&rows).Error
	if err != nil {
		return nil, err
	}
	if len(rows) == 0 {
		// fallback: global channels when monitor has no specific assignments
		var globalRows []notificationChannelModel
		err = r.db.WithContext(ctx).Raw(
			`SELECT * FROM notification_channels
			 WHERE is_global = true AND enabled = true
			 AND NOT EXISTS (
			     SELECT 1 FROM monitor_notification_channels mnc2 WHERE mnc2.monitor_id = ?
			 )`,
			monitorID,
		).Scan(&globalRows).Error
		if err != nil {
			return nil, err
		}
		result := make([]domain.MonitorChannelAssignment, len(globalRows))
		for i := range globalRows {
			ch, err := toDomainChannel(&globalRows[i])
			if err != nil {
				return nil, err
			}
			result[i] = domain.MonitorChannelAssignment{Channel: ch}
		}
		return result, nil
	}
	result := make([]domain.MonitorChannelAssignment, len(rows))
	for i, row := range rows {
		ch, err := toDomainChannel(&notificationChannelModel{
			ID: row.ID, Name: row.Name, Type: row.Type, Config: row.Config,
			IsGlobal: row.IsGlobal, Enabled: row.Enabled,
			RemindIntervalMin: row.RemindIntervalMin,
			CreatedAt: row.CreatedAt, UpdatedAt: row.UpdatedAt,
		})
		if err != nil {
			return nil, err
		}
		var triggers domain.AssignmentTriggers
		if len(row.Triggers) > 0 && string(row.Triggers) != "{}" {
			_ = json.Unmarshal(row.Triggers, &triggers)
		}
		result[i] = domain.MonitorChannelAssignment{Channel: ch, Triggers: triggers}
	}
	return result, nil
}

func (r *NotificationRepo) UpdateAssignmentTriggers(ctx context.Context, monitorID, channelID string, triggers domain.AssignmentTriggers) error {
	b, err := json.Marshal(triggers)
	if err != nil {
		return err
	}
	result := r.db.WithContext(ctx).Exec(
		`UPDATE monitor_notification_channels SET triggers = ?::jsonb WHERE monitor_id = ? AND channel_id = ?`,
		string(b), monitorID, channelID,
	)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return domain.ErrNotFound
	}
	return nil
}

func (r *NotificationRepo) LastSentAt(ctx context.Context, monitorID, channelID string) (time.Time, error) {
	var sentAt time.Time
	err := r.db.WithContext(ctx).Raw(
		`SELECT sent_at FROM notification_logs
		 WHERE monitor_id = ? AND channel_id = ? AND status = 'sent'
		 ORDER BY sent_at DESC LIMIT 1`,
		monitorID, channelID,
	).Scan(&sentAt).Error
	if err != nil {
		return time.Time{}, err
	}
	return sentAt, nil
}

func (r *NotificationRepo) AssignChannel(ctx context.Context, monitorID, channelID string) error {
	return r.db.WithContext(ctx).Exec(
		`INSERT INTO monitor_notification_channels (monitor_id, channel_id) VALUES (?, ?)
		 ON CONFLICT DO NOTHING`,
		monitorID, channelID,
	).Error
}

func (r *NotificationRepo) UnassignChannel(ctx context.Context, monitorID, channelID string) error {
	return r.db.WithContext(ctx).Exec(
		`DELETE FROM monitor_notification_channels WHERE monitor_id = ? AND channel_id = ?`,
		monitorID, channelID,
	).Error
}

func (r *NotificationRepo) LogNotification(ctx context.Context, log *domain.NotificationLog) error {
	return r.db.WithContext(ctx).Exec(
		`INSERT INTO notification_logs (channel_id, monitor_id, event, status, error_msg, sent_at)
		 VALUES (?, ?, ?, ?, ?, NOW())`,
		log.ChannelID, log.MonitorID, string(log.Event), log.Status, log.ErrorMsg,
	).Error
}

func (r *NotificationRepo) ListLogs(ctx context.Context, channelID string) ([]*domain.NotificationLog, error) {
	type logRow struct {
		ID          int64     `gorm:"column:id"`
		ChannelID   string    `gorm:"column:channel_id"`
		MonitorID   string    `gorm:"column:monitor_id"`
		MonitorName string    `gorm:"column:monitor_name"`
		Event       string    `gorm:"column:event"`
		Status      string    `gorm:"column:status"`
		ErrorMsg    string    `gorm:"column:error_msg"`
		SentAt      time.Time `gorm:"column:sent_at"`
	}
	var rows []logRow
	if err := r.db.WithContext(ctx).Raw(
		`SELECT l.id, l.channel_id, l.monitor_id,
		        COALESCE(m.name, '') AS monitor_name,
		        l.event, l.status, l.error_msg, l.sent_at
		 FROM notification_logs l
		 LEFT JOIN monitors m ON m.id = l.monitor_id
		 WHERE l.channel_id = ?
		 ORDER BY l.sent_at DESC LIMIT 100`,
		channelID,
	).Scan(&rows).Error; err != nil {
		return nil, err
	}
	result := make([]*domain.NotificationLog, len(rows))
	for i, row := range rows {
		result[i] = &domain.NotificationLog{
			ID:          row.ID,
			ChannelID:   row.ChannelID,
			MonitorID:   row.MonitorID,
			MonitorName: row.MonitorName,
			Event:       domain.NotificationEvent(row.Event),
			Status:      row.Status,
			ErrorMsg:    row.ErrorMsg,
			SentAt:      row.SentAt,
		}
	}
	return result, nil
}

func (r *NotificationRepo) FindReminders(ctx context.Context) ([]*domain.ReminderTarget, error) {
	type reminderRow struct {
		MonitorID string
		ChannelID string
	}
	var rows []reminderRow
	err := r.db.WithContext(ctx).Raw(`
		SELECT m.id AS monitor_id, nc.id AS channel_id
		FROM monitors m
		JOIN notification_channels nc ON (
		    nc.enabled = true
		    AND nc.remind_interval_min > 0
		    AND (
		        EXISTS (
		            SELECT 1 FROM monitor_notification_channels mnc
		            WHERE mnc.monitor_id = m.id AND mnc.channel_id = nc.id
		        )
		        OR (
		            nc.is_global = true
		            AND NOT EXISTS (
		                SELECT 1 FROM monitor_notification_channels mnc2
		                WHERE mnc2.monitor_id = m.id
		            )
		        )
		    )
		)
		WHERE m.last_status = 'down'
		  AND (
		      NOT EXISTS (
		          SELECT 1 FROM notification_logs nl
		          WHERE nl.monitor_id = m.id AND nl.channel_id = nc.id AND nl.event = 'down'
		      )
		      OR (
		          SELECT MAX(sent_at) FROM notification_logs nl2
		          WHERE nl2.monitor_id = m.id AND nl2.channel_id = nc.id AND nl2.event = 'down'
		      ) < NOW() - (nc.remind_interval_min || ' minutes')::INTERVAL
		  )
	`).Scan(&rows).Error
	if err != nil {
		return nil, err
	}
	result := make([]*domain.ReminderTarget, len(rows))
	for i, row := range rows {
		result[i] = &domain.ReminderTarget{MonitorID: row.MonitorID, ChannelID: row.ChannelID}
	}
	return result, nil
}

func (r *NotificationRepo) HasRecentSSLLog(ctx context.Context, monitorID string, within time.Duration) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).Raw(
		`SELECT COUNT(*) FROM notification_logs
		 WHERE monitor_id = ? AND event = 'ssl_expiry' AND sent_at > NOW() - ?::INTERVAL`,
		monitorID, fmt.Sprintf("%.0f seconds", within.Seconds()),
	).Scan(&count).Error
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

func toDomainChannel(m *notificationChannelModel) (*domain.NotificationChannel, error) {
	cfg := make(map[string]string)
	if len(m.Config) > 0 {
		if err := json.Unmarshal(m.Config, &cfg); err != nil {
			return nil, fmt.Errorf("unmarshal config: %w", err)
		}
	}
	return &domain.NotificationChannel{
		ID:                m.ID,
		Name:              m.Name,
		Type:              domain.ChannelType(m.Type),
		Config:            cfg,
		IsGlobal:          m.IsGlobal,
		Enabled:           m.Enabled,
		RemindIntervalMin: m.RemindIntervalMin,
		CreatedAt:         m.CreatedAt,
		UpdatedAt:         m.UpdatedAt,
	}, nil
}

func isNotFound(err error) bool {
	return err == gorm.ErrRecordNotFound
}
