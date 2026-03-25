package handler

import (
	"context"
	"net/http"

	"github.com/beedevz/hivepulse/internal/domain"
	"github.com/gin-gonic/gin"
)

type TagService interface {
	Create(ctx context.Context, name, color string) (*domain.Tag, error)
	Delete(ctx context.Context, id string) error
	List(ctx context.Context) ([]*domain.Tag, error)
}

type MonitorTagService interface {
	AssignTag(ctx context.Context, monitorID, tagID string) error
	UnassignTag(ctx context.Context, monitorID, tagID string) error
	GetTags(ctx context.Context, monitorID string) ([]*domain.Tag, error)
}

type TagHandler struct {
	tagSvc     TagService
	monitorSvc MonitorTagService
}

func NewTagHandler(tagSvc TagService, monitorSvc MonitorTagService) *TagHandler {
	return &TagHandler{tagSvc: tagSvc, monitorSvc: monitorSvc}
}

type tagWriteRequest struct {
	Name  string `json:"name"  binding:"required"`
	Color string `json:"color" binding:"required"`
}

type tagResponse struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	Color     string `json:"color"`
	CreatedAt string `json:"created_at"`
}

func toTagResponse(t *domain.Tag) tagResponse {
	return tagResponse{ID: t.ID, Name: t.Name, Color: t.Color, CreatedAt: t.CreatedAt.Format("2006-01-02T15:04:05Z")}
}

// List godoc
// @Summary      List all tags
// @Tags         tags
// @Security     Bearer
// @Produce      json
// @Success      200 {object} map[string]interface{}
// @Router       /tags [get]
func (h *TagHandler) List(c *gin.Context) {
	tags, err := h.tagSvc.List(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	out := make([]tagResponse, len(tags))
	for i, t := range tags {
		out[i] = toTagResponse(t)
	}
	c.JSON(http.StatusOK, gin.H{"data": out})
}

// Create godoc
// @Summary      Create a tag
// @Tags         tags
// @Security     Bearer
// @Accept       json
// @Produce      json
// @Param        body body tagWriteRequest true "Tag"
// @Success      201 {object} tagResponse
// @Failure      400 {object} map[string]string
// @Router       /tags [post]
func (h *TagHandler) Create(c *gin.Context) {
	var req tagWriteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	tag, err := h.tagSvc.Create(c.Request.Context(), req.Name, req.Color)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, toTagResponse(tag))
}

// Delete godoc
// @Summary      Delete a tag
// @Tags         tags
// @Security     Bearer
// @Param        id path string true "Tag ID"
// @Success      204
// @Failure      404 {object} map[string]string
// @Router       /tags/{id} [delete]
func (h *TagHandler) Delete(c *gin.Context) {
	if err := h.tagSvc.Delete(c.Request.Context(), c.Param("id")); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	c.Status(http.StatusNoContent)
}

// AssignTag godoc
// @Summary      Assign a tag to a monitor
// @Tags         monitors
// @Security     Bearer
// @Param        id     path string true "Monitor ID"
// @Param        tagId  path string true "Tag ID"
// @Success      204
// @Failure      404 {object} map[string]string
// @Router       /monitors/{id}/tags/{tagId} [post]
func (h *TagHandler) AssignTag(c *gin.Context) {
	if err := h.monitorSvc.AssignTag(c.Request.Context(), c.Param("id"), c.Param("tagId")); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	c.Status(http.StatusNoContent)
}

// UnassignTag godoc
// @Summary      Remove a tag from a monitor
// @Tags         monitors
// @Security     Bearer
// @Param        id     path string true "Monitor ID"
// @Param        tagId  path string true "Tag ID"
// @Success      204
// @Router       /monitors/{id}/tags/{tagId} [delete]
func (h *TagHandler) UnassignTag(c *gin.Context) {
	if err := h.monitorSvc.UnassignTag(c.Request.Context(), c.Param("id"), c.Param("tagId")); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}

// GetMonitorTags godoc
// @Summary      Get tags for a monitor
// @Tags         monitors
// @Security     Bearer
// @Param        id path string true "Monitor ID"
// @Success      200 {object} map[string]interface{}
// @Router       /monitors/{id}/tags [get]
func (h *TagHandler) GetMonitorTags(c *gin.Context) {
	tags, err := h.monitorSvc.GetTags(c.Request.Context(), c.Param("id"))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	out := make([]tagResponse, len(tags))
	for i, t := range tags {
		out[i] = toTagResponse(t)
	}
	c.JSON(http.StatusOK, gin.H{"data": out})
}
