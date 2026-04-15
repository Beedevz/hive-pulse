// Copyright (C) 2024 Beedevz. Licensed under AGPL v3 — see LICENSE for details.
package handler_test

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/beedevz/hivepulse/internal/adapter/handler"
	"github.com/beedevz/hivepulse/internal/domain"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

type mockUserService struct{ mock.Mock }

func (m *mockUserService) ListUsers(ctx context.Context, page, limit int) ([]*domain.User, int64, error) {
	args := m.Called(ctx, page, limit)
	return args.Get(0).([]*domain.User), args.Get(1).(int64), args.Error(2)
}
func (m *mockUserService) UpdateRole(ctx context.Context, id string, role domain.Role) error {
	return m.Called(ctx, id, role).Error(0)
}
func (m *mockUserService) DeleteUser(ctx context.Context, targetID, callerID string) error {
	return m.Called(ctx, targetID, callerID).Error(0)
}

func setupUserRouter(svc handler.UserService) *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	h := handler.NewUserHandler(svc)
	r.Use(func(c *gin.Context) {
		c.Set("userID", "test-caller-id")
		c.Set("role", string(domain.RoleAdmin))
		c.Next()
	})
	v1 := r.Group("/api/v1")
	v1.GET("/users", h.ListUsers)
	v1.PUT("/users/:id/role", h.UpdateRole)
	v1.DELETE("/users/:id", h.DeleteUser)
	return r
}

func TestUserList_ReturnsOK(t *testing.T) {
	svc := &mockUserService{}
	users := []*domain.User{{ID: "u1", Name: "Admin", Email: "admin@example.com", Role: domain.RoleAdmin}}
	svc.On("ListUsers", mock.Anything, 1, 20).Return(users, int64(1), nil)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/users", nil)
	setupUserRouter(svc).ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)

	var resp map[string]interface{}
	_ = json.Unmarshal(w.Body.Bytes(), &resp)
	assert.Equal(t, float64(1), resp["total"])
}

func TestUpdateUserRole_Returns200(t *testing.T) {
	svc := &mockUserService{}
	svc.On("UpdateRole", mock.Anything, "u1", domain.RoleEditor).Return(nil)

	body := map[string]string{"role": "editor"}
	b, _ := json.Marshal(body)
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("PUT", "/api/v1/users/u1/role", bytes.NewBuffer(b))
	req.Header.Set("Content-Type", "application/json")
	setupUserRouter(svc).ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestUpdateUserRole_InvalidRole_Returns400(t *testing.T) {
	svc := &mockUserService{}
	body := map[string]string{"role": "superadmin"}
	b, _ := json.Marshal(body)
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("PUT", "/api/v1/users/u1/role", bytes.NewBuffer(b))
	req.Header.Set("Content-Type", "application/json")
	setupUserRouter(svc).ServeHTTP(w, req)
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestDeleteUser_Returns204(t *testing.T) {
	svc := &mockUserService{}
	svc.On("DeleteUser", mock.Anything, "u2", "test-caller-id").Return(nil)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("DELETE", "/api/v1/users/u2", nil)
	setupUserRouter(svc).ServeHTTP(w, req)
	assert.Equal(t, http.StatusNoContent, w.Code)
}

func TestDeleteUser_SelfDelete_Returns400(t *testing.T) {
	svc := &mockUserService{}
	svc.On("DeleteUser", mock.Anything, "test-caller-id", "test-caller-id").
		Return(domain.ErrValidation)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("DELETE", "/api/v1/users/test-caller-id", nil)
	setupUserRouter(svc).ServeHTTP(w, req)
	assert.Equal(t, http.StatusBadRequest, w.Code)
}
