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
	if err := r.db.WithContext(ctx).Find(&rows).Error; err != nil {
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

func (r *NotificationRepo) GetChannelsForMonitor(ctx context.Context, monitorID string) ([]*domain.NotificationChannel, error) {
	var rows []notificationChannelModel
	err := r.db.WithContext(ctx).Raw(
		`SELECT nc.* FROM notification_channels nc
		 JOIN monitor_notification_channels mnc ON mnc.channel_id = nc.id
		 WHERE mnc.monitor_id = ? AND nc.enabled = true`,
		monitorID,
	).Scan(&rows).Error
	if err != nil {
		return nil, err
	}
	if len(rows) > 0 {
		return toChannelSlice(rows)
	}
	// fallback: global channels when monitor has no specific assignments
	err = r.db.WithContext(ctx).Raw(
		`SELECT * FROM notification_channels
		 WHERE is_global = true AND enabled = true
		 AND NOT EXISTS (
		     SELECT 1 FROM monitor_notification_channels mnc2 WHERE mnc2.monitor_id = ?
		 )`,
		monitorID,
	).Scan(&rows).Error
	if err != nil {
		return nil, err
	}
	return toChannelSlice(rows)
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
		ID        int64
		ChannelID string
		MonitorID string
		Event     string
		Status    string
		ErrorMsg  string
		SentAt    time.Time
	}
	var rows []logRow
	if err := r.db.WithContext(ctx).Raw(
		`SELECT id, channel_id, monitor_id, event, status, error_msg, sent_at
		 FROM notification_logs WHERE channel_id = ? ORDER BY sent_at DESC`,
		channelID,
	).Scan(&rows).Error; err != nil {
		return nil, err
	}
	result := make([]*domain.NotificationLog, len(rows))
	for i, row := range rows {
		result[i] = &domain.NotificationLog{
			ID:        row.ID,
			ChannelID: row.ChannelID,
			MonitorID: row.MonitorID,
			Event:     domain.NotificationEvent(row.Event),
			Status:    row.Status,
			ErrorMsg:  row.ErrorMsg,
			SentAt:    row.SentAt,
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
		monitorID, within.String(),
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

func toChannelSlice(rows []notificationChannelModel) ([]*domain.NotificationChannel, error) {
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

func isNotFound(err error) bool {
	return err == gorm.ErrRecordNotFound
}
