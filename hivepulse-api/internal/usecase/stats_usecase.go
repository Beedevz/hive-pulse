package usecase

import (
	"context"
	"fmt"
	"time"

	"github.com/beedevz/hivepulse/internal/domain"
	"github.com/beedevz/hivepulse/internal/port"
)

type StatsUsecase struct {
	repo port.StatsRepository
}

func NewStatsUsecase(repo port.StatsRepository) *StatsUsecase {
	return &StatsUsecase{repo: repo}
}

func (u *StatsUsecase) GetStats(ctx context.Context, monitorID, rangeParam string) (*domain.StatsResponse, error) {
	var buckets []*domain.StatsBucket
	var err error
	now := time.Now()

	switch rangeParam {
	case "24h":
		buckets, err = u.repo.GetHourly(ctx, monitorID, now.Add(-24*time.Hour))
	case "7d":
		buckets, err = u.repo.GetHourly(ctx, monitorID, now.Add(-7*24*time.Hour))
	case "30d":
		buckets, err = u.repo.GetDaily(ctx, monitorID, now.AddDate(0, 0, -30))
	case "90d":
		buckets, err = u.repo.GetDaily(ctx, monitorID, now.AddDate(0, 0, -90))
	default:
		return nil, fmt.Errorf("invalid range %q: must be 24h, 7d, 30d, or 90d", rangeParam)
	}
	if err != nil {
		return nil, err
	}

	var totalUp, totalAll int
	var sumPing int
	for _, b := range buckets {
		totalUp += b.UpCount
		totalAll += b.TotalCount
		sumPing += b.AvgPingMS
	}
	uptimePct := 0.0
	if totalAll > 0 {
		uptimePct = float64(totalUp) / float64(totalAll) * 100
	}
	avgPing := 0
	if len(buckets) > 0 {
		avgPing = sumPing / len(buckets)
	}

	return &domain.StatsResponse{
		UptimePct: uptimePct,
		AvgPingMS: avgPing,
		Buckets:   buckets,
	}, nil
}
