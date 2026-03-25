package handler

import (
	"context"
	"errors"
	"net/http"
	"strconv"
	"time"

	"github.com/beedevz/hivepulse/internal/domain"
	"github.com/beedevz/hivepulse/internal/usecase"
	"github.com/gin-gonic/gin"
)

// MonitorService abstracts the monitor usecase for testability.
type MonitorService interface {
	ListMonitors(ctx context.Context, page, limit int) ([]*domain.Monitor, int64, error)
	GetMonitor(ctx context.Context, id string) (*domain.Monitor, error)
	CreateMonitor(ctx context.Context, userID string, req usecase.MonitorRequest) error
	UpdateMonitor(ctx context.Context, id string, req usecase.MonitorRequest) error
	DeleteMonitor(ctx context.Context, id string) error
}

// HeartbeatService abstracts heartbeat queries for testability.
type HeartbeatService interface {
	FindLatest(ctx context.Context, monitorID string, limit int) ([]*domain.Heartbeat, error)
	GetUptime(ctx context.Context, monitorID string, since time.Time) (int64, int64, error)
}

// StatsService abstracts stats queries for testability.
type StatsService interface {
	GetStats(ctx context.Context, monitorID, rangeParam string) (*domain.StatsResponse, error)
}

type MonitorHandler struct {
	svc       MonitorService
	heartbeat HeartbeatService
	stats     StatsService
}

func NewMonitorHandler(svc MonitorService, heartbeat HeartbeatService, stats StatsService) *MonitorHandler {
	return &MonitorHandler{svc: svc, heartbeat: heartbeat, stats: stats}
}

type monitorResponse struct {
	ID              string  `json:"id"`
	Name            string  `json:"name"`
	CheckType       string  `json:"check_type"`
	Interval        int     `json:"interval"`
	Timeout         int     `json:"timeout"`
	Retries         int     `json:"retries"`
	RetryInterval   int     `json:"retry_interval"`
	Enabled         bool    `json:"enabled"`
	URL             string  `json:"url,omitempty"`
	Method          string  `json:"method,omitempty"`
	ExpectedStatus  int     `json:"expected_status,omitempty"`
	FollowRedirects bool    `json:"follow_redirects,omitempty"`
	Host            string  `json:"host,omitempty"`
	Port            int     `json:"port,omitempty"`
	PingHost        string  `json:"ping_host,omitempty"`
	PacketCount     int     `json:"packet_count,omitempty"`
	DNSHost         string  `json:"dns_host,omitempty"`
	RecordType      string  `json:"record_type,omitempty"`
	DNSServer       string  `json:"dns_server,omitempty"`
	LastStatus      string  `json:"last_status"`
	Uptime24h       float64 `json:"uptime_24h"`
	CreatedAt       string  `json:"created_at"`
}

func resolveStats(lastStatus string, up, total int64) (string, float64) {
	uptime24h := 0.0
	if total > 0 {
		uptime24h = float64(up) / float64(total)
	}
	return lastStatus, uptime24h
}

func toMonitorResponse(m *domain.Monitor, lastStatus string, uptime24h float64) monitorResponse {
	createdAt := ""
	if !m.CreatedAt.IsZero() {
		createdAt = m.CreatedAt.Format(time.RFC3339)
	}
	return monitorResponse{
		ID: m.ID, Name: m.Name, CheckType: string(m.CheckType),
		Interval: m.Interval, Timeout: m.Timeout, Retries: m.Retries, RetryInterval: m.RetryInterval, Enabled: m.Enabled,
		URL: m.URL, Method: m.Method, ExpectedStatus: m.ExpectedStatus, FollowRedirects: m.FollowRedirects,
		Host: m.Host, Port: m.Port,
		PingHost: m.PingHost, PacketCount: m.PacketCount,
		DNSHost: m.DNSHost, RecordType: m.RecordType, DNSServer: m.DNSServer,
		LastStatus: lastStatus, Uptime24h: uptime24h, CreatedAt: createdAt,
	}
}

// List godoc
// @Summary      List monitors
// @Tags         monitors
// @Security     Bearer
// @Produce      json
// @Param        page  query int false "Page number" default(1)
// @Param        limit query int false "Items per page" default(20)
// @Success      200 {object} map[string]interface{}
// @Failure      401 {object} map[string]string
// @Router       /monitors [get]
func (h *MonitorHandler) List(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	monitors, total, err := h.svc.ListMonitors(c.Request.Context(), page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
		return
	}
	data := make([]monitorResponse, len(monitors))
	for i, m := range monitors {
		up, total24h, _ := h.heartbeat.GetUptime(c.Request.Context(), m.ID, time.Now().Add(-24*time.Hour))
		lastStatus, uptime24h := resolveStats(m.LastStatus, up, total24h)
		data[i] = toMonitorResponse(m, lastStatus, uptime24h)
	}
	c.JSON(http.StatusOK, gin.H{"data": data, "total": total, "page": page, "limit": limit})
}

// Get godoc
// @Summary      Get monitor by ID
// @Tags         monitors
// @Security     Bearer
// @Param        id path string true "Monitor ID"
// @Produce      json
// @Success      200 {object} map[string]interface{}
// @Failure      404 {object} map[string]string
// @Router       /monitors/{id} [get]
func (h *MonitorHandler) Get(c *gin.Context) {
	m, err := h.svc.GetMonitor(c.Request.Context(), c.Param("id"))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	up, total, _ := h.heartbeat.GetUptime(c.Request.Context(), m.ID, time.Now().Add(-24*time.Hour))
	_, uptime24h := resolveStats(m.LastStatus, up, total)
	c.JSON(http.StatusOK, toMonitorResponse(m, m.LastStatus, uptime24h))
}

type monitorWriteRequest struct {
	Name          string `json:"name"         binding:"required"`
	CheckType     string `json:"check_type"   binding:"required"`
	Interval      int    `json:"interval"     binding:"required"`
	Timeout       int    `json:"timeout"`
	Retries       int    `json:"retries"`
	RetryInterval int    `json:"retry_interval"`
	Enabled       *bool  `json:"enabled"`
	URL             string `json:"url"`
	Method          string `json:"method"`
	ExpectedStatus  int    `json:"expected_status"`
	RequestHeaders  string `json:"request_headers"`
	RequestBody     string `json:"request_body"`
	FollowRedirects *bool  `json:"follow_redirects"`
	Host          string `json:"host"`
	Port          int    `json:"port"`
	PingHost      string `json:"ping_host"`
	PacketCount   int    `json:"packet_count"`
	DNSHost       string `json:"dns_host"`
	RecordType    string `json:"record_type"`
	ExpectedValue string `json:"expected_value"`
	DNSServer     string `json:"dns_server"`
}

func toMonitorRequest(req monitorWriteRequest) usecase.MonitorRequest {
	enabled := true
	if req.Enabled != nil {
		enabled = *req.Enabled
	}
	followRedirects := true
	if req.FollowRedirects != nil {
		followRedirects = *req.FollowRedirects
	}
	return usecase.MonitorRequest{
		Name: req.Name, CheckType: req.CheckType, Interval: req.Interval,
		Timeout: req.Timeout, Retries: req.Retries, RetryInterval: req.RetryInterval,
		Enabled: enabled, URL: req.URL, Method: req.Method, ExpectedStatus: req.ExpectedStatus,
		RequestHeaders: req.RequestHeaders, RequestBody: req.RequestBody, FollowRedirects: followRedirects,
		Host: req.Host, Port: req.Port, PingHost: req.PingHost, PacketCount: req.PacketCount,
		DNSHost: req.DNSHost, RecordType: req.RecordType, ExpectedValue: req.ExpectedValue, DNSServer: req.DNSServer,
	}
}

// Create godoc
// @Summary      Create monitor
// @Tags         monitors
// @Security     Bearer
// @Accept       json
// @Produce      json
// @Param        body body monitorWriteRequest true "Monitor payload"
// @Success      201 {object} map[string]string
// @Failure      400 {object} map[string]string
// @Failure      403 {object} map[string]string
// @Router       /monitors [post]
func (h *MonitorHandler) Create(c *gin.Context) {
	var req monitorWriteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	userID, _ := c.Get("userID")
	if err := h.svc.CreateMonitor(c.Request.Context(), userID.(string), toMonitorRequest(req)); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"message": "monitor created"})
}

// Update godoc
// @Summary      Update monitor
// @Tags         monitors
// @Security     Bearer
// @Accept       json
// @Param        id path string true "Monitor ID"
// @Param        body body monitorWriteRequest true "Monitor payload"
// @Success      200 {object} map[string]string
// @Failure      400 {object} map[string]string
// @Failure      403 {object} map[string]string
// @Router       /monitors/{id} [put]
func (h *MonitorHandler) Update(c *gin.Context) {
	var req monitorWriteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.svc.UpdateMonitor(c.Request.Context(), c.Param("id"), toMonitorRequest(req)); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "monitor updated"})
}

// Delete godoc
// @Summary      Delete monitor
// @Tags         monitors
// @Security     Bearer
// @Param        id path string true "Monitor ID"
// @Success      204
// @Failure      403 {object} map[string]string
// @Failure      404 {object} map[string]string
// @Router       /monitors/{id} [delete]
func (h *MonitorHandler) Delete(c *gin.Context) {
	if err := h.svc.DeleteMonitor(c.Request.Context(), c.Param("id")); err != nil {
		if errors.Is(err, domain.ErrNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
		return
	}
	c.Status(http.StatusNoContent)
}

// Heartbeats godoc
// @Summary      List heartbeats for a monitor
// @Tags         monitors
// @Security     Bearer
// @Param        id    path  string true  "Monitor ID"
// @Param        limit query int    false "Number of heartbeats" default(48)
// @Produce      json
// @Success      200 {object} map[string]interface{}
// @Failure      500 {object} map[string]string
// @Router       /monitors/{id}/heartbeats [get]
func (h *MonitorHandler) Heartbeats(c *gin.Context) {
	id := c.Param("id")
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "48"))
	if limit < 1 || limit > 200 {
		limit = 48
	}
	heartbeats, err := h.heartbeat.FindLatest(c.Request.Context(), id, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	type hbResp struct {
		Status    string `json:"status"`
		PingMS    int    `json:"ping_ms"`
		CheckedAt string `json:"checked_at"`
	}
	resp := make([]hbResp, len(heartbeats))
	for i, hb := range heartbeats {
		resp[i] = hbResp{Status: hb.Status, PingMS: hb.PingMS, CheckedAt: hb.CheckedAt.Format(time.RFC3339)}
	}
	c.JSON(http.StatusOK, gin.H{"data": resp})
}

// Stats godoc
// @Summary      Get aggregated stats for a monitor
// @Tags         monitors
// @Security     Bearer
// @Param        id    path  string true  "Monitor ID"
// @Param        range query string true  "Time range: 24h, 7d, or 90d"
// @Produce      json
// @Success      200 {object} domain.StatsResponse
// @Failure      400 {object} map[string]string
// @Failure      404 {object} map[string]string
// @Router       /monitors/{id}/stats [get]
func (h *MonitorHandler) Stats(c *gin.Context) {
	id := c.Param("id")
	rangeParam := c.Query("range")
	resp, err := h.stats.GetStats(c.Request.Context(), id, rangeParam)
	if err != nil {
		if errors.Is(err, domain.ErrNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, resp)
}
