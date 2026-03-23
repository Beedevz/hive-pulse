package handler_test

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/beedevz/hivepulse/internal/adapter/handler"
	"github.com/beedevz/hivepulse/internal/domain"
	"github.com/beedevz/hivepulse/internal/usecase"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

type mockMonitorService struct{ mock.Mock }

func (m *mockMonitorService) ListMonitors(ctx context.Context, page, limit int) ([]*domain.Monitor, int64, error) {
	args := m.Called(ctx, page, limit)
	return args.Get(0).([]*domain.Monitor), args.Get(1).(int64), args.Error(2)
}
func (m *mockMonitorService) GetMonitor(ctx context.Context, id string) (*domain.Monitor, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.Monitor), args.Error(1)
}
func (m *mockMonitorService) CreateMonitor(ctx context.Context, userID string, req usecase.MonitorRequest) error {
	return m.Called(ctx, userID, req).Error(0)
}
func (m *mockMonitorService) UpdateMonitor(ctx context.Context, id string, req usecase.MonitorRequest) error {
	return m.Called(ctx, id, req).Error(0)
}
func (m *mockMonitorService) DeleteMonitor(ctx context.Context, id string) error {
	return m.Called(ctx, id).Error(0)
}

type mockHeartbeatService struct{}

func (m *mockHeartbeatService) FindLatest(ctx context.Context, monitorID string, limit int) ([]*domain.Heartbeat, error) {
	return nil, nil
}
func (m *mockHeartbeatService) GetUptime(ctx context.Context, monitorID string, since time.Time) (int64, int64, error) {
	return 0, 0, nil
}

func setupMonitorRouter(svc handler.MonitorService) *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	h := handler.NewMonitorHandler(svc, &mockHeartbeatService{})
	r.Use(func(c *gin.Context) {
		c.Set("userID", "test-user-id")
		c.Set("role", string(domain.RoleAdmin))
		c.Next()
	})
	v1 := r.Group("/api/v1")
	v1.GET("/monitors", h.List)
	v1.POST("/monitors", h.Create)
	v1.GET("/monitors/:id", h.Get)
	v1.PUT("/monitors/:id", h.Update)
	v1.DELETE("/monitors/:id", h.Delete)
	v1.GET("/monitors/:id/heartbeats", h.Heartbeats)
	return r
}

func TestMonitorList_ReturnsOK(t *testing.T) {
	svc := &mockMonitorService{}
	monitors := []*domain.Monitor{{ID: "m1", Name: "Test", CheckType: domain.CheckHTTP}}
	svc.On("ListMonitors", mock.Anything, 1, 20).Return(monitors, int64(1), nil)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/monitors", nil)
	setupMonitorRouter(svc).ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)

	var resp map[string]interface{}
	_ = json.Unmarshal(w.Body.Bytes(), &resp)
	assert.Equal(t, float64(1), resp["total"])
}

func TestMonitorCreate_Returns201(t *testing.T) {
	svc := &mockMonitorService{}
	svc.On("CreateMonitor", mock.Anything, "test-user-id", mock.AnythingOfType("usecase.MonitorRequest")).Return(nil)

	body := map[string]interface{}{
		"name": "My API", "check_type": "http", "url": "https://example.com", "interval": 60,
	}
	b, _ := json.Marshal(body)
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/monitors", bytes.NewBuffer(b))
	req.Header.Set("Content-Type", "application/json")
	setupMonitorRouter(svc).ServeHTTP(w, req)
	assert.Equal(t, http.StatusCreated, w.Code)
}

func TestMonitorCreate_InvalidBody_Returns400(t *testing.T) {
	svc := &mockMonitorService{}
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/monitors", bytes.NewBufferString("not-json"))
	req.Header.Set("Content-Type", "application/json")
	setupMonitorRouter(svc).ServeHTTP(w, req)
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestMonitorGet_ReturnsOK(t *testing.T) {
	svc := &mockMonitorService{}
	monitor := &domain.Monitor{ID: "m1", Name: "Test", CheckType: domain.CheckHTTP}
	svc.On("GetMonitor", mock.Anything, "m1").Return(monitor, nil)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/monitors/m1", nil)
	setupMonitorRouter(svc).ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestMonitorGet_NotFound_Returns404(t *testing.T) {
	svc := &mockMonitorService{}
	svc.On("GetMonitor", mock.Anything, "missing").Return(nil, domain.ErrNotFound)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/monitors/missing", nil)
	setupMonitorRouter(svc).ServeHTTP(w, req)
	assert.Equal(t, http.StatusNotFound, w.Code)
}

func TestMonitorDelete_Returns204(t *testing.T) {
	svc := &mockMonitorService{}
	svc.On("DeleteMonitor", mock.Anything, "m1").Return(nil)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("DELETE", "/api/v1/monitors/m1", nil)
	setupMonitorRouter(svc).ServeHTTP(w, req)
	assert.Equal(t, http.StatusNoContent, w.Code)
}
