// Copyright (C) 2024 Beedevz. Licensed under AGPL v3 — see LICENSE for details.
package handler

import (
	"context"
	"errors"
	"net/http"
	"strconv"

	"github.com/beedevz/hivepulse/internal/domain"
	"github.com/beedevz/hivepulse/internal/usecase"
	"github.com/gin-gonic/gin"
)

type StatusPageService interface {
	Create(ctx context.Context, req usecase.StatusPageRequest) (*domain.StatusPage, error)
	Update(ctx context.Context, id string, req usecase.StatusPageRequest) (*domain.StatusPage, error)
	Delete(ctx context.Context, id string) error
	List(ctx context.Context, page, limit int) ([]*domain.StatusPage, int64, error)
	GetByID(ctx context.Context, id string) (*domain.StatusPage, error)
	GetPublic(ctx context.Context, slug string) (*domain.PublicStatusPageData, error)
}

type StatusPageHandler struct{ svc StatusPageService }

func NewStatusPageHandler(svc StatusPageService) *StatusPageHandler {
	return &StatusPageHandler{svc: svc}
}

type statusPageWriteRequest struct {
	Title        string   `json:"title"         binding:"required"`
	Slug         string   `json:"slug"`
	Description  string   `json:"description"`
	LogoURL      string   `json:"logo_url"`
	AccentColor  string   `json:"accent_color"`
	CustomDomain string   `json:"custom_domain"`
	TagIDs       []string `json:"tag_ids"`
}

type statusPageResponse struct {
	ID           string   `json:"id"`
	Slug         string   `json:"slug"`
	Title        string   `json:"title"`
	Description  string   `json:"description"`
	LogoURL      string   `json:"logo_url"`
	AccentColor  string   `json:"accent_color"`
	CustomDomain string   `json:"custom_domain"`
	TagIDs       []string `json:"tag_ids"`
	CreatedAt    string   `json:"created_at"`
}

func toStatusPageResponse(sp *domain.StatusPage) statusPageResponse {
	tagIDs := sp.TagIDs
	if tagIDs == nil {
		tagIDs = []string{}
	}
	return statusPageResponse{
		ID: sp.ID, Slug: sp.Slug, Title: sp.Title,
		Description: sp.Description, LogoURL: sp.LogoURL,
		AccentColor: sp.AccentColor, CustomDomain: sp.CustomDomain,
		TagIDs: tagIDs, CreatedAt: sp.CreatedAt.Format("2006-01-02T15:04:05Z"),
	}
}

// List godoc
// @Summary      List status pages
// @Tags         status-pages
// @Security     Bearer
// @Produce      json
// @Param        page  query int false "Page"  default(1)
// @Param        limit query int false "Limit" default(20)
// @Success      200 {object} map[string]interface{}
// @Router       /status-pages [get]
func (h *StatusPageHandler) List(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	pages, total, err := h.svc.List(c.Request.Context(), page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	out := make([]statusPageResponse, len(pages))
	for i, sp := range pages {
		out[i] = toStatusPageResponse(sp)
	}
	c.JSON(http.StatusOK, gin.H{"data": out, "total": total, "page": page, "limit": limit})
}

// Get godoc
// @Summary      Get status page by ID
// @Tags         status-pages
// @Security     Bearer
// @Param        id path string true "Status Page ID"
// @Produce      json
// @Success      200 {object} statusPageResponse
// @Failure      404 {object} map[string]string
// @Router       /status-pages/{id} [get]
func (h *StatusPageHandler) Get(c *gin.Context) {
	sp, err := h.svc.GetByID(c.Request.Context(), c.Param("id"))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	c.JSON(http.StatusOK, toStatusPageResponse(sp))
}

// Create godoc
// @Summary      Create a status page
// @Tags         status-pages
// @Security     Bearer
// @Accept       json
// @Produce      json
// @Param        body body statusPageWriteRequest true "Status Page"
// @Success      201 {object} statusPageResponse
// @Failure      400 {object} map[string]string
// @Router       /status-pages [post]
func (h *StatusPageHandler) Create(c *gin.Context) {
	var req statusPageWriteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	sp, err := h.svc.Create(c.Request.Context(), usecase.StatusPageRequest{
		Title: req.Title, Slug: req.Slug, Description: req.Description,
		LogoURL: req.LogoURL, AccentColor: req.AccentColor,
		CustomDomain: req.CustomDomain, TagIDs: req.TagIDs,
	})
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, toStatusPageResponse(sp))
}

// Update godoc
// @Summary      Update a status page
// @Tags         status-pages
// @Security     Bearer
// @Param        id   path string                true "Status Page ID"
// @Param        body body statusPageWriteRequest true "Status Page"
// @Success      200 {object} statusPageResponse
// @Failure      404 {object} map[string]string
// @Router       /status-pages/{id} [put]
func (h *StatusPageHandler) Update(c *gin.Context) {
	var req statusPageWriteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	sp, err := h.svc.Update(c.Request.Context(), c.Param("id"), usecase.StatusPageRequest{
		Title: req.Title, Slug: req.Slug, Description: req.Description,
		LogoURL: req.LogoURL, AccentColor: req.AccentColor,
		CustomDomain: req.CustomDomain, TagIDs: req.TagIDs,
	})
	if err != nil {
		if errors.Is(err, domain.ErrNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		} else {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		}
		return
	}
	c.JSON(http.StatusOK, toStatusPageResponse(sp))
}

// Delete godoc
// @Summary      Delete a status page
// @Tags         status-pages
// @Security     Bearer
// @Param        id path string true "Status Page ID"
// @Success      204
// @Failure      404 {object} map[string]string
// @Router       /status-pages/{id} [delete]
func (h *StatusPageHandler) Delete(c *gin.Context) {
	if err := h.svc.Delete(c.Request.Context(), c.Param("id")); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	c.Status(http.StatusNoContent)
}

// GetPublic godoc
// @Summary      Get public status page by slug
// @Tags         status-pages
// @Param        slug path string true "Slug"
// @Produce      json
// @Success      200 {object} map[string]interface{}
// @Failure      404 {object} map[string]string
// @Router       /s/{slug} [get]
func (h *StatusPageHandler) GetPublic(c *gin.Context) {
	data, err := h.svc.GetPublic(c.Request.Context(), c.Param("slug"))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	c.JSON(http.StatusOK, data)
}
