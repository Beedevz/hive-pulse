// Copyright (C) 2024 Beedevz. Licensed under AGPL v3 — see LICENSE for details.
package middleware

import (
	"net/http"

	"github.com/beedevz/hivepulse/internal/domain"
	"github.com/gin-gonic/gin"
)

func RoleGuard(allowed ...domain.Role) gin.HandlerFunc {
	return func(c *gin.Context) {
		roleVal, exists := c.Get("role")
		if !exists {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "forbidden"})
			return
		}
		role := domain.Role(roleVal.(string))
		for _, r := range allowed {
			if role == r {
				c.Next()
				return
			}
		}
		c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "forbidden"})
	}
}
