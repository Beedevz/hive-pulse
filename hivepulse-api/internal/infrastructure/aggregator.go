package infrastructure

import (
	"context"
	"log"
	"time"

	"github.com/beedevz/hivepulse/internal/port"
	"gorm.io/gorm"
)

type Aggregator struct {
	db       *gorm.DB
	reminder port.ReminderNotifier
}

func NewAggregator(db *gorm.DB) *Aggregator { return &Aggregator{db: db} }

func (a *Aggregator) SetReminder(r port.ReminderNotifier) { a.reminder = r }

func (a *Aggregator) Start(ctx context.Context) {
	ticker := time.NewTicker(5 * time.Minute)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			if err := a.Tick(ctx); err != nil {
				log.Printf("aggregator tick error: %v", err)
			}
		}
	}
}

func (a *Aggregator) Tick(ctx context.Context) error {
	if err := a.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// 1. UPSERT hourly buckets (last 2 hours)
		if err := tx.Exec(`
			INSERT INTO stats_hourly (monitor_id, hour, up_count, total_count, avg_ping_ms)
			SELECT
				monitor_id,
				date_trunc('hour', checked_at) AS hour,
				COUNT(*) FILTER (WHERE status = 'up') AS up_count,
				COUNT(*) AS total_count,
				COALESCE(AVG(ping_ms)::int, 0) AS avg_ping_ms
			FROM heartbeats
			WHERE checked_at >= NOW() - INTERVAL '2 hours'
			GROUP BY monitor_id, date_trunc('hour', checked_at)
			ON CONFLICT (monitor_id, hour) DO UPDATE
			SET up_count    = EXCLUDED.up_count,
			    total_count = EXCLUDED.total_count,
			    avg_ping_ms = EXCLUDED.avg_ping_ms
		`).Error; err != nil {
			return err
		}

		// 1b. UPSERT minutely buckets (last 2 minutes)
		if err := tx.Exec(`
			INSERT INTO stats_minutely (monitor_id, minute, up_count, total_count, avg_ping_ms)
			SELECT
				monitor_id,
				date_trunc('minute', checked_at) AS minute,
				COUNT(*) FILTER (WHERE status = 'up') AS up_count,
				COUNT(*) AS total_count,
				COALESCE(AVG(ping_ms)::int, 0) AS avg_ping_ms
			FROM heartbeats
			WHERE checked_at >= NOW() - INTERVAL '2 minutes'
			GROUP BY monitor_id, date_trunc('minute', checked_at)
			ON CONFLICT (monitor_id, minute) DO UPDATE
			SET up_count    = EXCLUDED.up_count,
			    total_count = EXCLUDED.total_count,
			    avg_ping_ms = EXCLUDED.avg_ping_ms
		`).Error; err != nil {
			return err
		}

		// 2. UPSERT daily buckets (last 2 days)
		if err := tx.Exec(`
			INSERT INTO stats_daily (monitor_id, day, up_count, total_count, avg_ping_ms)
			SELECT
				monitor_id,
				date_trunc('day', checked_at)::date AS day,
				COUNT(*) FILTER (WHERE status = 'up') AS up_count,
				COUNT(*) AS total_count,
				COALESCE(AVG(ping_ms)::int, 0) AS avg_ping_ms
			FROM heartbeats
			WHERE checked_at >= NOW() - INTERVAL '2 days'
			GROUP BY monitor_id, date_trunc('day', checked_at)
			ON CONFLICT (monitor_id, day) DO UPDATE
			SET up_count    = EXCLUDED.up_count,
			    total_count = EXCLUDED.total_count,
			    avg_ping_ms = EXCLUDED.avg_ping_ms
		`).Error; err != nil {
			return err
		}

		// 3. Delete heartbeats older than 30 days
		if err := tx.Exec(`DELETE FROM heartbeats WHERE checked_at < NOW() - INTERVAL '30 days'`).Error; err != nil {
			return err
		}

		// Delete minutely stats older than 7 days
		if err := tx.Exec(`DELETE FROM stats_minutely WHERE minute < NOW() - INTERVAL '7 days'`).Error; err != nil {
			return err
		}

		// 4. Delete stats_hourly older than 8 days
		if err := tx.Exec(`DELETE FROM stats_hourly WHERE hour < NOW() - INTERVAL '8 days'`).Error; err != nil {
			return err
		}

		// 5. Delete stats_daily older than 90 days
		if err := tx.Exec(`DELETE FROM stats_daily WHERE day < NOW() - INTERVAL '90 days'`).Error; err != nil {
			return err
		}

		return nil
	}); err != nil {
		return err
	}
	if a.reminder != nil {
		if err := a.reminder.NotifyReminders(ctx); err != nil {
			log.Printf("aggregator: reminder error: %v", err)
		}
	}
	return nil
}
