package usecase

import (
	"context"
	"fmt"
	"time"

	"github.com/beedevz/hivepulse/internal/domain"
	"github.com/beedevz/hivepulse/internal/port"
)

type StatsUsecase struct {
	statsRepo    port.StatsRepository
	incidentRepo port.IncidentRepository
}

func NewStatsUsecase(statsRepo port.StatsRepository, incidentRepo port.IncidentRepository) *StatsUsecase {
	return &StatsUsecase{statsRepo: statsRepo, incidentRepo: incidentRepo}
}

func (u *StatsUsecase) GetStats(ctx context.Context, monitorID, rangeParam string) (*domain.StatsResponse, error) {
	var buckets []*domain.StatsBucket
	var err error
	var since time.Time
	now := time.Now()

	switch rangeParam {
	case "1h":
		since = now.Add(-1 * time.Hour)
		buckets, err = u.statsRepo.GetMinutely(ctx, monitorID, since)
	case "3h":
		since = now.Add(-3 * time.Hour)
		buckets, err = u.statsRepo.GetMinutely(ctx, monitorID, since)
	case "6h":
		since = now.Add(-6 * time.Hour)
		buckets, err = u.statsRepo.GetMinutely(ctx, monitorID, since)
	case "24h":
		since = now.Add(-24 * time.Hour)
		buckets, err = u.statsRepo.GetMinutely(ctx, monitorID, since)
	case "48h":
		since = now.Add(-48 * time.Hour)
		buckets, err = u.statsRepo.GetHourly(ctx, monitorID, since)
	case "7d":
		since = now.Add(-7 * 24 * time.Hour)
		buckets, err = u.statsRepo.GetHourly(ctx, monitorID, since)
	case "15d":
		since = now.Add(-15 * 24 * time.Hour)
		buckets, err = u.statsRepo.GetHourly(ctx, monitorID, since)
	case "30d":
		since = now.AddDate(0, 0, -30)
		buckets, err = u.statsRepo.GetDaily(ctx, monitorID, since)
	case "90d":
		since = now.AddDate(0, 0, -90)
		buckets, err = u.statsRepo.GetDaily(ctx, monitorID, since)
	default:
		return nil, fmt.Errorf("invalid range %q: must be 1h, 3h, 6h, 24h, 48h, 7d, 15d, 30d, or 90d", rangeParam)
	}
	if err != nil {
		return nil, err
	}

	incidents, err := u.incidentRepo.FindByMonitorAndTimeRange(ctx, monitorID, since)
	if err != nil {
		return nil, err
	}
	downPeriods := make([]*domain.DownPeriod, len(incidents))
	for i, inc := range incidents {
		downPeriods[i] = &domain.DownPeriod{
			StartedAt:  inc.StartedAt,
			ResolvedAt: inc.ResolvedAt,
		}
	}

	var totalUp, totalAll, sumPing int
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
		UptimePct:   uptimePct,
		AvgPingMS:   avgPing,
		Buckets:     buckets,
		DownPeriods: downPeriods,
	}, nil
}

func (u *StatsUsecase) GetOverview(ctx context.Context) (*domain.OverviewStats, error) {
	buckets, err := u.statsRepo.GetGlobalHourly(ctx, time.Now().Add(-12*time.Hour))
	if err != nil {
		return nil, err
	}
	var sumWeighted, sumCount int
	for _, b := range buckets {
		sumWeighted += b.AvgPingMS * b.TotalCount
		sumCount += b.TotalCount
	}
	avgPing := 0
	if sumCount > 0 {
		avgPing = sumWeighted / sumCount
	}
	return &domain.OverviewStats{
		AvgPingMS: avgPing,
		Buckets:   buckets,
	}, nil
}
