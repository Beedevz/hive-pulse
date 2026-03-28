package handler

import (
	"net/http"
	"strconv"
	"time"

	"github.com/beedevz/hivepulse/internal/domain"
	"github.com/beedevz/hivepulse/internal/port"
	"github.com/gin-gonic/gin"
)

type IncidentHandler struct {
	repo port.IncidentRepository
}

func NewIncidentHandler(repo port.IncidentRepository) *IncidentHandler {
	return &IncidentHandler{repo: repo}
}

type incidentResponse struct {
	ID          int64   `json:"id"`
	MonitorID   string  `json:"monitor_id"`
	MonitorName string  `json:"monitor_name"`
	StartedAt   string  `json:"started_at"`
	ResolvedAt  *string `json:"resolved_at"`
	DurationS   int     `json:"duration_s"`
	ErrorMsg    string  `json:"error_msg"`
}

func toIncidentResponse(inc *domain.Incident) incidentResponse {
	var resolvedAt *string
	var durationS int
	if inc.ResolvedAt != nil {
		s := inc.ResolvedAt.Format(time.RFC3339)
		resolvedAt = &s
		durationS = int(inc.ResolvedAt.Sub(inc.StartedAt).Seconds())
	} else {
		durationS = int(time.Since(inc.StartedAt).Seconds())
	}
	return incidentResponse{
		ID:          inc.ID,
		MonitorID:   inc.MonitorID,
		MonitorName: inc.MonitorName,
		StartedAt:   inc.StartedAt.Format(time.RFC3339),
		ResolvedAt:  resolvedAt,
		DurationS:   durationS,
		ErrorMsg:    inc.ErrorMsg,
	}
}

type incidentListResponse struct {
	Data  []incidentResponse `json:"data"`
	Total int                `json:"total"`
}

// List godoc
// @Summary      List incidents
// @Tags         incidents
// @Security     Bearer
// @Param        status query string false "Filter: active|resolved|all" default(all)
// @Param        q      query string false "Search by monitor name (case-insensitive)"
// @Param        offset query int    false "Pagination offset" default(0)
// @Param        limit  query int    false "Max results" default(20)
// @Produce      json
// @Success      200 {object} incidentListResponse
// @Router       /incidents [get]
func (h *IncidentHandler) List(c *gin.Context) {
	status := c.DefaultQuery("status", "all")
	q := c.Query("q")
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if limit < 1 || limit > 200 {
		limit = 20
	}
	if offset < 0 {
		offset = 0
	}

	var incidents []*domain.Incident
	var total int
	var err error

	ctx := c.Request.Context()
	switch status {
	case "active":
		incidents, total, err = h.repo.FindActive(ctx, q, offset, limit)
	case "resolved":
		incidents, total, err = h.repo.FindResolved(ctx, q, offset, limit)
	default:
		incidents, total, err = h.repo.FindRecent(ctx, q, offset, limit)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
		return
	}

	data := make([]incidentResponse, len(incidents))
	for i, inc := range incidents {
		data[i] = toIncidentResponse(inc)
	}
	c.JSON(http.StatusOK, incidentListResponse{Data: data, Total: total})
}
