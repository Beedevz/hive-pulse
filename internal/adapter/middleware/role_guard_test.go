// Copyright (C) 2024 Beedevz. Licensed under AGPL v3 — see LICENSE for details.
package middleware_test

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/beedevz/hivepulse/internal/adapter/middleware"
	"github.com/beedevz/hivepulse/internal/domain"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func TestRoleGuard_AllowsMatchingRole(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.GET("/protected", func(c *gin.Context) {
		c.Set("role", string(domain.RoleAdmin))
	}, middleware.RoleGuard(domain.RoleAdmin), func(c *gin.Context) {
		c.Status(http.StatusOK)
	})
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/protected", nil)
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestRoleGuard_BlocksNonMatchingRole(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.GET("/protected", func(c *gin.Context) {
		c.Set("role", string(domain.RoleViewer))
	}, middleware.RoleGuard(domain.RoleAdmin, domain.RoleEditor), func(c *gin.Context) {
		c.Status(http.StatusOK)
	})
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/protected", nil)
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusForbidden, w.Code)
}

func TestRoleGuard_BlocksWhenRoleNotInContext(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.GET("/protected", middleware.RoleGuard(domain.RoleAdmin), func(c *gin.Context) {
		c.Status(http.StatusOK)
	})
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/protected", nil)
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusForbidden, w.Code)
}
