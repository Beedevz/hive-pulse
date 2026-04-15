// Copyright (C) 2024 Beedevz. Licensed under AGPL v3 — see LICENSE for details.
package repo

import (
	"context"
	"time"

	"github.com/beedevz/hivepulse/internal/domain"
	"github.com/beedevz/hivepulse/internal/port"
	"gorm.io/gorm"
)

type StatsRepo struct{ db *gorm.DB }

func NewStatsRepo(db *gorm.DB) port.StatsRepository { return &StatsRepo{db} }

func (r *StatsRepo) GetHourly(ctx context.Context, monitorID string, since time.Time) ([]*domain.StatsBucket, error) {
	type row struct {
		Hour       time.Time
		UpCount    int
		TotalCount int
		AvgPingMS  int
	}
	var rows []row
	err := r.db.WithContext(ctx).Raw(`
		SELECT hour AS hour, up_count, total_count, avg_ping_ms
		FROM stats_hourly
		WHERE monitor_id = ? AND hour >= ?
		ORDER BY hour ASC`, monitorID, since).Scan(&rows).Error
	if err != nil {
		return nil, err
	}
	out := make([]*domain.StatsBucket, len(rows))
	for i, rw := range rows {
		out[i] = &domain.StatsBucket{
			Time:       rw.Hour,
			UpCount:    rw.UpCount,
			TotalCount: rw.TotalCount,
			AvgPingMS:  rw.AvgPingMS,
		}
	}
	return out, nil
}

func (r *StatsRepo) GetMinutely(ctx context.Context, monitorID string, since time.Time) ([]*domain.StatsBucket, error) {
	type row struct {
		Minute     time.Time
		UpCount    int
		TotalCount int
		AvgPingMS  int
	}
	var rows []row
	err := r.db.WithContext(ctx).Raw(`
		SELECT minute AS minute, up_count, total_count, avg_ping_ms
		FROM stats_minutely
		WHERE monitor_id = ? AND minute >= ?
		ORDER BY minute ASC`, monitorID, since).Scan(&rows).Error
	if err != nil {
		return nil, err
	}
	out := make([]*domain.StatsBucket, len(rows))
	for i, rw := range rows {
		out[i] = &domain.StatsBucket{
			Time:       rw.Minute,
			UpCount:    rw.UpCount,
			TotalCount: rw.TotalCount,
			AvgPingMS:  rw.AvgPingMS,
		}
	}
	return out, nil
}

func (r *StatsRepo) GetDaily(ctx context.Context, monitorID string, since time.Time) ([]*domain.StatsBucket, error) {
	type row struct {
		Day        time.Time
		UpCount    int
		TotalCount int
		AvgPingMS  int
	}
	var rows []row
	err := r.db.WithContext(ctx).Raw(`
		SELECT day AS day, up_count, total_count, avg_ping_ms
		FROM stats_daily
		WHERE monitor_id = ? AND day >= ?
		ORDER BY day ASC`, monitorID, since).Scan(&rows).Error
	if err != nil {
		return nil, err
	}
	out := make([]*domain.StatsBucket, len(rows))
	for i, rw := range rows {
		out[i] = &domain.StatsBucket{
			Time:       rw.Day,
			UpCount:    rw.UpCount,
			TotalCount: rw.TotalCount,
			AvgPingMS:  rw.AvgPingMS,
		}
	}
	return out, nil
}

func (r *StatsRepo) GetGlobalHourly(ctx context.Context, since time.Time) ([]*domain.StatsBucket, error) {
	type row struct {
		Hour       time.Time
		UpCount    int
		TotalCount int
		AvgPingMS  int
	}
	var rows []row
	err := r.db.WithContext(ctx).Raw(`
		SELECT hour,
		       SUM(up_count)::int AS up_count,
		       SUM(total_count)::int AS total_count,
		       CASE WHEN SUM(total_count) > 0
		            THEN (SUM(avg_ping_ms::bigint * total_count) / SUM(total_count))::int
		            ELSE 0 END AS avg_ping_ms
		FROM stats_hourly
		WHERE hour >= ?
		GROUP BY hour
		ORDER BY hour ASC`, since).Scan(&rows).Error
	if err != nil {
		return nil, err
	}
	out := make([]*domain.StatsBucket, len(rows))
	for i, rw := range rows {
		out[i] = &domain.StatsBucket{
			Time:       rw.Hour,
			UpCount:    rw.UpCount,
			TotalCount: rw.TotalCount,
			AvgPingMS:  rw.AvgPingMS,
		}
	}
	return out, nil
}
