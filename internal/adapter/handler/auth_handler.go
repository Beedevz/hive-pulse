// Copyright (C) 2024 Beedevz. Licensed under AGPL v3 — see LICENSE for details.
package handler

import (
	"context"
	"net/http"
	"time"

	"github.com/beedevz/hivepulse/internal/domain"
	"github.com/gin-gonic/gin"
)

// AuthService abstracts the auth usecase for testability.
type AuthService interface {
	SetupRequired(ctx context.Context) (bool, error)
	Setup(ctx context.Context, name, email, password string) error
	Login(ctx context.Context, email, password, deviceFP, ip string) (string, string, error)
	Refresh(ctx context.Context, rawRefreshToken string) (string, string, error)
	Logout(ctx context.Context, rawRefreshToken string) error
	Me(ctx context.Context, userID string) (*domain.User, error)
}

type AuthHandler struct {
	svc           AuthService
	refreshExpiry time.Duration
}

func NewAuthHandler(svc AuthService, refreshExpiry time.Duration) *AuthHandler {
	return &AuthHandler{svc: svc, refreshExpiry: refreshExpiry}
}

// SetupStatus godoc
// @Summary      Check setup status
// @Tags         auth
// @Produce      json
// @Success      200 {object} map[string]bool
// @Router       /auth/setup/status [get]
func (h *AuthHandler) SetupStatus(c *gin.Context) {
	required, err := h.svc.SetupRequired(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"setup_required": required})
}

// Setup godoc
// @Summary      Create first admin (one-time)
// @Tags         auth
// @Accept       json
// @Produce      json
// @Param        body body setupRequest true "Setup payload"
// @Success      201 {object} map[string]string
// @Failure      400 {object} map[string]string
// @Failure      403 {object} map[string]string
// @Router       /auth/setup [post]
func (h *AuthHandler) Setup(c *gin.Context) {
	var req setupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.svc.Setup(c.Request.Context(), req.Name, req.Email, req.Password); err != nil {
		if err == domain.ErrSetupCompleted {
			c.JSON(http.StatusForbidden, gin.H{"error": "setup already completed"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"message": "admin created"})
}

// Login godoc
// @Summary      Login
// @Tags         auth
// @Accept       json
// @Produce      json
// @Param        body body loginRequest true "Credentials"
// @Success      200 {object} map[string]string
// @Failure      400 {object} map[string]string
// @Failure      401 {object} map[string]string
// @Router       /auth/login [post]
func (h *AuthHandler) Login(c *gin.Context) {
	var req loginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	access, refresh, err := h.svc.Login(c.Request.Context(), req.Email, req.Password, c.GetHeader("User-Agent"), c.ClientIP())
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}
	h.setRefreshCookie(c, refresh)
	c.JSON(http.StatusOK, gin.H{"access_token": access})
}

// Refresh godoc
// @Summary      Refresh access token
// @Tags         auth
// @Produce      json
// @Success      200 {object} map[string]string
// @Failure      401 {object} map[string]string
// @Router       /auth/refresh [post]
func (h *AuthHandler) Refresh(c *gin.Context) {
	raw, err := c.Cookie("refresh_token")
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "missing refresh token"})
		return
	}
	access, newRefresh, err := h.svc.Refresh(c.Request.Context(), raw)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid refresh token"})
		return
	}
	h.setRefreshCookie(c, newRefresh)
	c.JSON(http.StatusOK, gin.H{"access_token": access})
}

// Logout godoc
// @Summary      Logout
// @Tags         auth
// @Security     Bearer
// @Success      204
// @Router       /auth/logout [post]
func (h *AuthHandler) Logout(c *gin.Context) {
	raw, _ := c.Cookie("refresh_token")
	_ = h.svc.Logout(c.Request.Context(), raw)
	c.SetCookie("refresh_token", "", -1, "/", "", true, true)
	c.Status(http.StatusNoContent)
}

// Me godoc
// @Summary      Get current user
// @Tags         auth
// @Security     Bearer
// @Produce      json
// @Success      200 {object} map[string]interface{}
// @Failure      401 {object} map[string]string
// @Router       /auth/me [get]
func (h *AuthHandler) Me(c *gin.Context) {
	userID, _ := c.Get("userID")
	user, err := h.svc.Me(c.Request.Context(), userID.(string))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"id":    user.ID,
		"email": user.Email,
		"name":  user.Name,
		"role":  string(user.Role),
	})
}

func (h *AuthHandler) setRefreshCookie(c *gin.Context, token string) {
	c.SetSameSite(http.SameSiteStrictMode)
	c.SetCookie("refresh_token", token, int(h.refreshExpiry.Seconds()), "/", "", true, true)
}

type setupRequest struct {
	Name     string `json:"name" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
}

type loginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}
