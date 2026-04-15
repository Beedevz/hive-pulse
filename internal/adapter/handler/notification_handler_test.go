// Copyright (C) 2024 Beedevz. Licensed under AGPL v3 — see LICENSE for details.
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
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

type mockNotificationService struct {
	channels []*domain.NotificationChannel
	err      error
}

func (m *mockNotificationService) CreateChannel(_ context.Context, ch *domain.NotificationChannel) error {
	ch.ID = "new-id"
	return m.err
}
func (m *mockNotificationService) UpdateChannel(_ context.Context, _ *domain.NotificationChannel) error {
	return m.err
}
func (m *mockNotificationService) DeleteChannel(_ context.Context, _ string) error {
	return m.err
}
func (m *mockNotificationService) ListChannels(_ context.Context) ([]*domain.NotificationChannel, error) {
	return m.channels, m.err
}
func (m *mockNotificationService) GetChannelsForMonitor(_ context.Context, _ string) ([]domain.MonitorChannelAssignment, error) {
	assignments := make([]domain.MonitorChannelAssignment, len(m.channels))
	for i, ch := range m.channels {
		assignments[i] = domain.MonitorChannelAssignment{Channel: ch}
	}
	return assignments, m.err
}
func (m *mockNotificationService) UpdateAssignmentTriggers(_ context.Context, _, _ string, _ domain.AssignmentTriggers) error {
	return m.err
}
func (m *mockNotificationService) AssignChannel(_ context.Context, _, _ string) error {
	return m.err
}
func (m *mockNotificationService) UnassignChannel(_ context.Context, _, _ string) error {
	return m.err
}
func (m *mockNotificationService) ListLogs(_ context.Context, _ string) ([]*domain.NotificationLog, error) {
	return nil, m.err
}
func (m *mockNotificationService) SendTest(_ context.Context, _ string, _ *domain.Monitor) error {
	return m.err
}

func setupNotificationRouter(svc handler.NotificationService, role domain.Role) *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	h := handler.NewNotificationHandler(svc)
	r.Use(func(c *gin.Context) {
		c.Set("userID", "test-user-id")
		c.Set("role", string(role))
		c.Next()
	})
	// admin guard middleware
	adminOnly := func(c *gin.Context) {
		if c.GetString("role") != string(domain.RoleAdmin) {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "forbidden"})
			return
		}
		c.Next()
	}
	v1 := r.Group("/api/v1")
	v1.Use(adminOnly)
	v1.GET("/notification-channels", h.List)
	v1.POST("/notification-channels", h.Create)
	v1.PUT("/notification-channels/:id", h.Update)
	v1.DELETE("/notification-channels/:id", h.Delete)
	v1.GET("/notification-channels/:id/logs", h.Logs)
	return r
}

func TestNotificationList_Returns200(t *testing.T) {
	svc := &mockNotificationService{
		channels: []*domain.NotificationChannel{
			{
				ID:        "ch1",
				Name:      "My Webhook",
				Type:      domain.ChannelWebhook,
				Config:    map[string]string{"webhook_url": "https://hooks.example.com/secret"},
				IsGlobal:  true,
				Enabled:   true,
				CreatedAt: time.Now(),
			},
		},
	}

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/notification-channels", nil)
	setupNotificationRouter(svc, domain.RoleAdmin).ServeHTTP(w, req)

	require.Equal(t, http.StatusOK, w.Code)

	var resp map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &resp)
	require.NoError(t, err)

	data := resp["data"].([]interface{})
	require.Len(t, data, 1)

	ch := data[0].(map[string]interface{})
	assert.Equal(t, "ch1", ch["id"])
	assert.Equal(t, "My Webhook", ch["name"])

	// webhook_url must be masked
	config := ch["config"].(map[string]interface{})
	assert.Equal(t, "***", config["webhook_url"])
}

func TestNotificationCreate_Returns201(t *testing.T) {
	svc := &mockNotificationService{}

	body := map[string]interface{}{
		"name":   "Slack Alerts",
		"type":   "slack",
		"config": map[string]string{"webhook_url": "https://hooks.slack.com/xyz"},
	}
	b, _ := json.Marshal(body)
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/notification-channels", bytes.NewBuffer(b))
	req.Header.Set("Content-Type", "application/json")
	setupNotificationRouter(svc, domain.RoleAdmin).ServeHTTP(w, req)

	assert.Equal(t, http.StatusCreated, w.Code)

	var resp map[string]interface{}
	require.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Equal(t, "new-id", resp["id"])
}

func TestNotification_NonAdmin_Returns403(t *testing.T) {
	svc := &mockNotificationService{}

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/notification-channels", nil)
	setupNotificationRouter(svc, domain.RoleViewer).ServeHTTP(w, req)

	assert.Equal(t, http.StatusForbidden, w.Code)
}
