package handler

import (
	"context"
	"errors"
	"net/http"
	"strconv"

	"github.com/beedevz/hivepulse/internal/domain"
	"github.com/gin-gonic/gin"
)

// UserService abstracts the user usecase for testability.
type UserService interface {
	ListUsers(ctx context.Context, page, limit int) ([]*domain.User, int64, error)
	UpdateRole(ctx context.Context, id string, role domain.Role) error
	DeleteUser(ctx context.Context, targetID, callerID string) error
}

type UserHandler struct{ svc UserService }

func NewUserHandler(svc UserService) *UserHandler { return &UserHandler{svc: svc} }

// ListUsers godoc
// @Summary      List users (admin only)
// @Tags         users
// @Security     Bearer
// @Produce      json
// @Param        page  query int false "Page number" default(1)
// @Param        limit query int false "Items per page" default(20)
// @Success      200 {object} map[string]interface{}
// @Failure      500 {object} map[string]string
// @Router       /users [get]
func (h *UserHandler) ListUsers(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	users, total, err := h.svc.ListUsers(c.Request.Context(), page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
		return
	}
	data := make([]gin.H, len(users))
	for i, u := range users {
		data[i] = gin.H{
			"id":         u.ID,
			"name":       u.Name,
			"email":      u.Email,
			"role":       string(u.Role),
			"created_at": u.CreatedAt,
		}
	}
	c.JSON(http.StatusOK, gin.H{"data": data, "total": total, "page": page, "limit": limit})
}

// UpdateRole godoc
// @Summary      Update user role (admin only)
// @Tags         users
// @Security     Bearer
// @Accept       json
// @Produce      json
// @Param        id   path string true "User ID"
// @Param        body body map[string]string true "Role payload"
// @Success      200 {object} map[string]string
// @Failure      400 {object} map[string]string
// @Failure      403 {object} map[string]string
// @Router       /users/{id}/role [put]
func (h *UserHandler) UpdateRole(c *gin.Context) {
	var req struct {
		Role string `json:"role" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	role := domain.Role(req.Role)
	if role != domain.RoleAdmin && role != domain.RoleEditor && role != domain.RoleViewer {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid role"})
		return
	}
	if err := h.svc.UpdateRole(c.Request.Context(), c.Param("id"), role); err != nil {
		if errors.Is(err, domain.ErrNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "role updated"})
}

// DeleteUser godoc
// @Summary      Delete user (admin only)
// @Tags         users
// @Security     Bearer
// @Param        id path string true "User ID"
// @Success      204
// @Failure      400 {object} map[string]string
// @Failure      403 {object} map[string]string
// @Router       /users/{id} [delete]
func (h *UserHandler) DeleteUser(c *gin.Context) {
	callerID, _ := c.Get("userID")
	if err := h.svc.DeleteUser(c.Request.Context(), c.Param("id"), callerID.(string)); err != nil {
		if errors.Is(err, domain.ErrValidation) {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		if errors.Is(err, domain.ErrNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
		return
	}
	c.Status(http.StatusNoContent)
}
