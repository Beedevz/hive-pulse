package handler

import (
	"context"
	"net/http"

	"github.com/beedevz/hivepulse/internal/domain"
	"github.com/gin-gonic/gin"
)

// NotificationService abstracts NotificationUsecase for the handler.
type NotificationService interface {
	CreateChannel(ctx context.Context, ch *domain.NotificationChannel) error
	UpdateChannel(ctx context.Context, ch *domain.NotificationChannel) error
	DeleteChannel(ctx context.Context, id string) error
	ListChannels(ctx context.Context) ([]*domain.NotificationChannel, error)
	GetChannelsForMonitor(ctx context.Context, monitorID string) ([]domain.MonitorChannelAssignment, error)
	UpdateAssignmentTriggers(ctx context.Context, monitorID, channelID string, triggers domain.AssignmentTriggers) error
	AssignChannel(ctx context.Context, monitorID, channelID string) error
	UnassignChannel(ctx context.Context, monitorID, channelID string) error
	ListLogs(ctx context.Context, channelID string) ([]*domain.NotificationLog, error)
	SendTest(ctx context.Context, channelID string, monitor *domain.Monitor) error
}

type NotificationHandler struct{ svc NotificationService }

func NewNotificationHandler(svc NotificationService) *NotificationHandler {
	return &NotificationHandler{svc: svc}
}

type channelWriteRequest struct {
	Name              string            `json:"name"    binding:"required"`
	Type              string            `json:"type"    binding:"required"`
	Config            map[string]string `json:"config"`
	IsGlobal          bool              `json:"is_global"`
	Enabled           *bool             `json:"enabled"`
	RemindIntervalMin int               `json:"remind_interval_min"`
}

type channelResponse struct {
	ID                string            `json:"id"`
	Name              string            `json:"name"`
	Type              string            `json:"type"`
	Config            map[string]string `json:"config"`
	IsGlobal          bool              `json:"is_global"`
	Enabled           bool              `json:"enabled"`
	RemindIntervalMin int               `json:"remind_interval_min"`
	CreatedAt         string            `json:"created_at"`
}

func maskConfig(ch *domain.NotificationChannel) map[string]string {
	out := make(map[string]string, len(ch.Config))
	for k, v := range ch.Config {
		if k == "secret" || k == "webhook_url" {
			out[k] = "***"
		} else {
			out[k] = v
		}
	}
	return out
}

func toChannelResponse(ch *domain.NotificationChannel) channelResponse {
	return channelResponse{
		ID: ch.ID, Name: ch.Name, Type: string(ch.Type),
		Config: maskConfig(ch), IsGlobal: ch.IsGlobal, Enabled: ch.Enabled,
		RemindIntervalMin: ch.RemindIntervalMin,
		CreatedAt:         ch.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}
}

func (h *NotificationHandler) List(c *gin.Context) {
	channels, err := h.svc.ListChannels(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
		return
	}
	resp := make([]channelResponse, len(channels))
	for i, ch := range channels {
		resp[i] = toChannelResponse(ch)
	}
	c.JSON(http.StatusOK, gin.H{"data": resp})
}

func (h *NotificationHandler) Create(c *gin.Context) {
	var req channelWriteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	enabled := true
	if req.Enabled != nil {
		enabled = *req.Enabled
	}
	ch := &domain.NotificationChannel{
		Name: req.Name, Type: domain.ChannelType(req.Type),
		Config: req.Config, IsGlobal: req.IsGlobal,
		Enabled: enabled, RemindIntervalMin: req.RemindIntervalMin,
	}
	if err := h.svc.CreateChannel(c.Request.Context(), ch); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, toChannelResponse(ch))
}

func (h *NotificationHandler) Update(c *gin.Context) {
	var req channelWriteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	cfg := make(map[string]string)
	for k, v := range req.Config {
		if v != "***" {
			cfg[k] = v
		}
	}
	enabled := true
	if req.Enabled != nil {
		enabled = *req.Enabled
	}
	ch := &domain.NotificationChannel{
		ID: c.Param("id"), Name: req.Name, Type: domain.ChannelType(req.Type),
		Config: cfg, IsGlobal: req.IsGlobal,
		Enabled: enabled, RemindIntervalMin: req.RemindIntervalMin,
	}
	if err := h.svc.UpdateChannel(c.Request.Context(), ch); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "channel updated"})
}

func (h *NotificationHandler) Delete(c *gin.Context) {
	if err := h.svc.DeleteChannel(c.Request.Context(), c.Param("id")); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
		return
	}
	c.Status(http.StatusNoContent)
}

func (h *NotificationHandler) Logs(c *gin.Context) {
	logs, err := h.svc.ListLogs(c.Request.Context(), c.Param("id"))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": logs})
}

type assignmentResponse struct {
	ID       string                    `json:"id"`
	Name     string                    `json:"name"`
	Type     string                    `json:"type"`
	Triggers domain.AssignmentTriggers `json:"triggers"`
}

func (h *NotificationHandler) ListMonitorChannels(c *gin.Context) {
	assignments, err := h.svc.GetChannelsForMonitor(c.Request.Context(), c.Param("id"))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	resp := make([]assignmentResponse, len(assignments))
	for i, a := range assignments {
		resp[i] = assignmentResponse{
			ID:       a.Channel.ID,
			Name:     a.Channel.Name,
			Type:     string(a.Channel.Type),
			Triggers: a.Triggers,
		}
	}
	c.JSON(http.StatusOK, gin.H{"data": resp})
}

// UpdateAssignmentTriggers godoc
// @Summary     Update trigger rules for a monitor-channel assignment
// @Tags        monitors
// @Accept      json
// @Produce     json
// @Param       id        path      string                       true  "Monitor ID"
// @Param       channelId path      string                       true  "Channel ID"
// @Param       body      body      domain.AssignmentTriggers    true  "Trigger rules"
// @Success     200       {object}  map[string]string
// @Failure     400       {object}  map[string]string
// @Failure     500       {object}  map[string]string
// @Security    Bearer
// @Router      /monitors/{id}/channels/{channelId}/triggers [put]
func (h *NotificationHandler) UpdateAssignmentTriggers(c *gin.Context) {
	var triggers domain.AssignmentTriggers
	if err := c.ShouldBindJSON(&triggers); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.svc.UpdateAssignmentTriggers(c.Request.Context(), c.Param("id"), c.Param("channelId"), triggers); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "triggers updated"})
}

func (h *NotificationHandler) AssignChannel(c *gin.Context) {
	if err := h.svc.AssignChannel(c.Request.Context(), c.Param("id"), c.Param("chID")); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusCreated)
}

func (h *NotificationHandler) UnassignChannel(c *gin.Context) {
	if err := h.svc.UnassignChannel(c.Request.Context(), c.Param("id"), c.Param("chID")); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
		return
	}
	c.Status(http.StatusNoContent)
}

func (h *NotificationHandler) TestChannel(c *gin.Context) {
	testMonitor := &domain.Monitor{
		ID:   "test",
		Name: "Test Monitor (HivePulse Test)",
		URL:  "https://example.com",
	}
	if err := h.svc.SendTest(c.Request.Context(), c.Param("id"), testMonitor); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "test notification sent"})
}
