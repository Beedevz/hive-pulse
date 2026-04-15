// Copyright (C) 2024 Beedevz. Licensed under AGPL v3 — see LICENSE for details.
package handler_test

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/beedevz/hivepulse/internal/adapter/handler"
	"github.com/beedevz/hivepulse/internal/domain"
	"github.com/beedevz/hivepulse/internal/port"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

type mockIncidentRepo struct{ mock.Mock }

func (m *mockIncidentRepo) Create(ctx context.Context, inc *domain.Incident) error {
	return m.Called(ctx, inc).Error(0)
}
func (m *mockIncidentRepo) Resolve(ctx context.Context, monitorID string, resolvedAt time.Time) error {
	return m.Called(ctx, monitorID, resolvedAt).Error(0)
}
func (m *mockIncidentRepo) FindActive(ctx context.Context, q string, offset, limit int) ([]*domain.Incident, int, error) {
	args := m.Called(ctx, q, offset, limit)
	return args.Get(0).([]*domain.Incident), args.Int(1), args.Error(2)
}
func (m *mockIncidentRepo) FindRecent(ctx context.Context, q string, offset, limit int) ([]*domain.Incident, int, error) {
	args := m.Called(ctx, q, offset, limit)
	return args.Get(0).([]*domain.Incident), args.Int(1), args.Error(2)
}
func (m *mockIncidentRepo) FindResolved(ctx context.Context, q string, offset, limit int) ([]*domain.Incident, int, error) {
	args := m.Called(ctx, q, offset, limit)
	return args.Get(0).([]*domain.Incident), args.Int(1), args.Error(2)
}
func (m *mockIncidentRepo) FindByMonitorAndTimeRange(ctx context.Context, monitorID string, since time.Time) ([]*domain.Incident, error) {
	args := m.Called(ctx, monitorID, since)
	return args.Get(0).([]*domain.Incident), args.Error(1)
}

var _ port.IncidentRepository = (*mockIncidentRepo)(nil)

func newIncidentRouter(repo *mockIncidentRepo) *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	h := handler.NewIncidentHandler(repo)
	r.GET("/incidents", h.List)
	return r
}

func TestIncidentHandler_List_Resolved(t *testing.T) {
	repo := &mockIncidentRepo{}
	now := time.Now()
	resolved := []*domain.Incident{{ID: 1, MonitorID: "m1", MonitorName: "API", StartedAt: now.Add(-10 * time.Minute), ResolvedAt: func() *time.Time { t := now; return &t }()}}
	repo.On("FindResolved", mock.Anything, "", 0, 20).Return(resolved, 1, nil)

	r := newIncidentRouter(repo)
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/incidents?status=resolved", nil)
	r.ServeHTTP(w, req)

	assert.Equal(t, 200, w.Code)
	var body struct {
		Data  []map[string]interface{} `json:"data"`
		Total int                      `json:"total"`
	}
	_ = json.Unmarshal(w.Body.Bytes(), &body)
	assert.Equal(t, 1, body.Total)
	assert.Equal(t, "API", body.Data[0]["monitor_name"])
	repo.AssertExpectations(t)
}

func TestIncidentHandler_List_SearchParam(t *testing.T) {
	repo := &mockIncidentRepo{}
	repo.On("FindResolved", mock.Anything, "api", 0, 20).Return([]*domain.Incident{}, 0, nil)

	r := newIncidentRouter(repo)
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/incidents?status=resolved&q=api", nil)
	r.ServeHTTP(w, req)

	assert.Equal(t, 200, w.Code)
	repo.AssertExpectations(t)
}

func TestIncidentHandler_List_LimitClamped(t *testing.T) {
	repo := &mockIncidentRepo{}
	repo.On("FindRecent", mock.Anything, "", 0, 20).Return([]*domain.Incident{}, 0, nil)

	r := newIncidentRouter(repo)
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/incidents?limit=999", nil)
	r.ServeHTTP(w, req)

	assert.Equal(t, 200, w.Code)
	repo.AssertExpectations(t)
}

func TestIncidentHandler_List_OffsetPagination(t *testing.T) {
	repo := &mockIncidentRepo{}
	repo.On("FindResolved", mock.Anything, "", 20, 20).Return([]*domain.Incident{}, 47, nil)

	r := newIncidentRouter(repo)
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/incidents?status=resolved&offset=20", nil)
	r.ServeHTTP(w, req)

	assert.Equal(t, 200, w.Code)
	var body struct{ Total int `json:"total"` }
	_ = json.Unmarshal(w.Body.Bytes(), &body)
	assert.Equal(t, 47, body.Total)
	repo.AssertExpectations(t)
}
