// Copyright (C) 2024 Beedevz. Licensed under AGPL v3 — see LICENSE for details.
package usecase_test

import (
	"context"
	"testing"
	"time"

	"github.com/beedevz/hivepulse/internal/domain"
	"github.com/beedevz/hivepulse/internal/usecase"
	"github.com/beedevz/hivepulse/internal/usecase/mocks"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
)

func newStatsUC(statsRepo *mocks.StatsRepository, incidentRepo *mocks.IncidentRepository) *usecase.StatsUsecase {
	return usecase.NewStatsUsecase(statsRepo, incidentRepo)
}

func TestGetStats_1h_UsesMinutely(t *testing.T) {
	statsRepo := mocks.NewStatsRepository(t)
	incidentRepo := mocks.NewIncidentRepository(t)
	buckets := []*domain.StatsBucket{{Time: time.Now().Add(-30 * time.Minute), UpCount: 1, TotalCount: 1, AvgPingMS: 50}}
	statsRepo.On("GetMinutely", mock.Anything, "m1", mock.AnythingOfType("time.Time")).Return(buckets, nil)
	incidentRepo.On("FindByMonitorAndTimeRange", mock.Anything, "m1", mock.AnythingOfType("time.Time")).Return([]*domain.Incident{}, nil)

	uc := newStatsUC(statsRepo, incidentRepo)
	resp, err := uc.GetStats(context.Background(), "m1", "1h")
	require.NoError(t, err)
	assert.Len(t, resp.Buckets, 1)
	statsRepo.AssertCalled(t, "GetMinutely", mock.Anything, "m1", mock.AnythingOfType("time.Time"))
	statsRepo.AssertNotCalled(t, "GetHourly")
}

func TestGetStats_24h_UsesMinutely(t *testing.T) {
	statsRepo := mocks.NewStatsRepository(t)
	incidentRepo := mocks.NewIncidentRepository(t)
	statsRepo.On("GetMinutely", mock.Anything, "m1", mock.AnythingOfType("time.Time")).Return([]*domain.StatsBucket{}, nil)
	incidentRepo.On("FindByMonitorAndTimeRange", mock.Anything, "m1", mock.AnythingOfType("time.Time")).Return([]*domain.Incident{}, nil)

	uc := newStatsUC(statsRepo, incidentRepo)
	_, err := uc.GetStats(context.Background(), "m1", "24h")
	require.NoError(t, err)
	statsRepo.AssertCalled(t, "GetMinutely", mock.Anything, "m1", mock.AnythingOfType("time.Time"))
	statsRepo.AssertNotCalled(t, "GetHourly")
}

func TestGetStats_7d_UsesHourly(t *testing.T) {
	statsRepo := mocks.NewStatsRepository(t)
	incidentRepo := mocks.NewIncidentRepository(t)
	statsRepo.On("GetHourly", mock.Anything, "m1", mock.AnythingOfType("time.Time")).Return([]*domain.StatsBucket{}, nil)
	incidentRepo.On("FindByMonitorAndTimeRange", mock.Anything, "m1", mock.AnythingOfType("time.Time")).Return([]*domain.Incident{}, nil)

	uc := newStatsUC(statsRepo, incidentRepo)
	_, err := uc.GetStats(context.Background(), "m1", "7d")
	require.NoError(t, err)
	statsRepo.AssertCalled(t, "GetHourly", mock.Anything, "m1", mock.AnythingOfType("time.Time"))
	statsRepo.AssertNotCalled(t, "GetMinutely")
}

func TestGetStats_90d_UsesDaily(t *testing.T) {
	statsRepo := mocks.NewStatsRepository(t)
	incidentRepo := mocks.NewIncidentRepository(t)
	statsRepo.On("GetDaily", mock.Anything, "m1", mock.AnythingOfType("time.Time")).Return([]*domain.StatsBucket{}, nil)
	incidentRepo.On("FindByMonitorAndTimeRange", mock.Anything, "m1", mock.AnythingOfType("time.Time")).Return([]*domain.Incident{}, nil)

	uc := newStatsUC(statsRepo, incidentRepo)
	_, err := uc.GetStats(context.Background(), "m1", "90d")
	require.NoError(t, err)
	statsRepo.AssertCalled(t, "GetDaily", mock.Anything, "m1", mock.AnythingOfType("time.Time"))
}

func TestGetOverview_WeightedAverage(t *testing.T) {
	statsRepo := mocks.NewStatsRepository(t)
	incidentRepo := mocks.NewIncidentRepository(t)
	buckets := []*domain.StatsBucket{
		{Time: time.Now().Add(-2 * time.Hour), UpCount: 10, TotalCount: 10, AvgPingMS: 100},
		{Time: time.Now().Add(-1 * time.Hour), UpCount: 10, TotalCount: 20, AvgPingMS: 50},
	}
	statsRepo.On("GetGlobalHourly", mock.Anything, mock.AnythingOfType("time.Time")).Return(buckets, nil)

	uc := newStatsUC(statsRepo, incidentRepo)
	resp, err := uc.GetOverview(context.Background())
	require.NoError(t, err)
	// Weighted: (100*10 + 50*20) / (10+20) = 2000/30 = 66
	assert.Equal(t, 66, resp.AvgPingMS)
	assert.Len(t, resp.Buckets, 2)
}

func TestGetOverview_NoBuckets(t *testing.T) {
	statsRepo := mocks.NewStatsRepository(t)
	incidentRepo := mocks.NewIncidentRepository(t)
	statsRepo.On("GetGlobalHourly", mock.Anything, mock.AnythingOfType("time.Time")).Return([]*domain.StatsBucket{}, nil)

	uc := newStatsUC(statsRepo, incidentRepo)
	resp, err := uc.GetOverview(context.Background())
	require.NoError(t, err)
	assert.Equal(t, 0, resp.AvgPingMS)
	assert.Empty(t, resp.Buckets)
}

func TestGetStats_InvalidRange_ReturnsError(t *testing.T) {
	statsRepo := mocks.NewStatsRepository(t)
	incidentRepo := mocks.NewIncidentRepository(t)
	uc := newStatsUC(statsRepo, incidentRepo)
	_, err := uc.GetStats(context.Background(), "m1", "99y")
	require.Error(t, err)
}

func TestGetStats_PopulatesDownPeriods(t *testing.T) {
	statsRepo := mocks.NewStatsRepository(t)
	incidentRepo := mocks.NewIncidentRepository(t)
	statsRepo.On("GetMinutely", mock.Anything, "m1", mock.AnythingOfType("time.Time")).Return([]*domain.StatsBucket{}, nil)

	resolved := time.Now().Add(-10 * time.Minute)
	incidents := []*domain.Incident{
		{ID: 1, MonitorID: "m1", StartedAt: time.Now().Add(-30 * time.Minute), ResolvedAt: &resolved},
		{ID: 2, MonitorID: "m1", StartedAt: time.Now().Add(-5 * time.Minute), ResolvedAt: nil}, // active
	}
	incidentRepo.On("FindByMonitorAndTimeRange", mock.Anything, "m1", mock.AnythingOfType("time.Time")).Return(incidents, nil)

	uc := newStatsUC(statsRepo, incidentRepo)
	resp, err := uc.GetStats(context.Background(), "m1", "1h")
	require.NoError(t, err)
	require.Len(t, resp.DownPeriods, 2)
	assert.NotNil(t, resp.DownPeriods[0].ResolvedAt)
	assert.Nil(t, resp.DownPeriods[1].ResolvedAt) // active incident has nil ResolvedAt
}
