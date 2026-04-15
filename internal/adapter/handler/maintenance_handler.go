// Copyright (C) 2024 Beedevz. Licensed under AGPL v3 — see LICENSE for details.
package handler

import (
	"net/http"
	"time"

	"github.com/beedevz/hivepulse/internal/domain"
	"github.com/beedevz/hivepulse/internal/port"
	"github.com/gin-gonic/gin"
)

type MaintenanceHandler struct {
	repo port.MaintenanceWindowRepository
}

func NewMaintenanceHandler(repo port.MaintenanceWindowRepository) *MaintenanceHandler {
	return &MaintenanceHandler{repo: repo}
}

type mwResponse struct {
	ID        string  `json:"id"`
	MonitorID *string `json:"monitor_id"`
	StartsAt  string  `json:"starts_at"`
	EndsAt    string  `json:"ends_at"`
	Reason    string  `json:"reason"`
	CreatedAt string  `json:"created_at"`
}

func toMWResponse(mw *domain.MaintenanceWindow) mwResponse {
	return mwResponse{
		ID:        mw.ID,
		MonitorID: mw.MonitorID,
		StartsAt:  mw.StartsAt.Format(time.RFC3339),
		EndsAt:    mw.EndsAt.Format(time.RFC3339),
		Reason:    mw.Reason,
		CreatedAt: mw.CreatedAt.Format(time.RFC3339),
	}
}

type mwCreateRequest struct {
	MonitorID *string `json:"monitor_id"`
	StartsAt  string  `json:"starts_at" binding:"required"`
	EndsAt    string  `json:"ends_at" binding:"required"`
	Reason    string  `json:"reason"`
}

// ListByMonitor godoc
// @Summary      List maintenance windows for a monitor
// @Tags         maintenance
// @Security     Bearer
// @Param        id path string true "Monitor ID"
// @Produce      json
// @Success      200 {object} map[string]interface{}
// @Router       /monitors/{id}/maintenance [get]
func (h *MaintenanceHandler) ListByMonitor(c *gin.Context) {
	windows, err := h.repo.FindByMonitor(c.Request.Context(), c.Param("id"))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
		return
	}
	data := make([]mwResponse, len(windows))
	for i, w := range windows {
		data[i] = toMWResponse(w)
	}
	c.JSON(http.StatusOK, gin.H{"data": data})
}

// ListGlobal godoc
// @Summary      List global maintenance windows
// @Tags         maintenance
// @Security     Bearer
// @Produce      json
// @Success      200 {object} map[string]interface{}
// @Router       /maintenance-windows [get]
func (h *MaintenanceHandler) ListGlobal(c *gin.Context) {
	windows, err := h.repo.FindGlobal(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
		return
	}
	data := make([]mwResponse, len(windows))
	for i, w := range windows {
		data[i] = toMWResponse(w)
	}
	c.JSON(http.StatusOK, gin.H{"data": data})
}

// Create godoc
// @Summary      Create maintenance window
// @Tags         maintenance
// @Security     Bearer
// @Accept       json
// @Param        body body mwCreateRequest true "Maintenance window"
// @Produce      json
// @Success      201 {object} mwResponse
// @Failure      400 {object} map[string]string
// @Router       /maintenance-windows [post]
func (h *MaintenanceHandler) Create(c *gin.Context) {
	var req mwCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	startsAt, err := time.Parse(time.RFC3339, req.StartsAt)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid starts_at format, use RFC3339"})
		return
	}
	endsAt, err := time.Parse(time.RFC3339, req.EndsAt)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid ends_at format, use RFC3339"})
		return
	}
	if !endsAt.After(startsAt) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ends_at must be after starts_at"})
		return
	}
	mw := &domain.MaintenanceWindow{
		MonitorID: req.MonitorID,
		StartsAt:  startsAt,
		EndsAt:    endsAt,
		Reason:    req.Reason,
	}
	if err := h.repo.Create(c.Request.Context(), mw); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
		return
	}
	c.JSON(http.StatusCreated, toMWResponse(mw))
}

// Delete godoc
// @Summary      Delete maintenance window
// @Tags         maintenance
// @Security     Bearer
// @Param        id path string true "Window ID"
// @Success      204
// @Router       /maintenance-windows/{id} [delete]
func (h *MaintenanceHandler) Delete(c *gin.Context) {
	if err := h.repo.Delete(c.Request.Context(), c.Param("id")); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
		return
	}
	c.Status(http.StatusNoContent)
}
