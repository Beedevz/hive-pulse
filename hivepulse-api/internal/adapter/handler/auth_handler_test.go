package handler_test

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/beedevz/hivepulse/internal/adapter/handler"
	"github.com/beedevz/hivepulse/internal/domain"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// mockAuthService implements handler.AuthService
type mockAuthService struct{ mock.Mock }

func (m *mockAuthService) SetupRequired(ctx context.Context) (bool, error) {
	args := m.Called(ctx)
	return args.Bool(0), args.Error(1)
}
func (m *mockAuthService) Setup(ctx context.Context, name, email, password string) error {
	return m.Called(ctx, name, email, password).Error(0)
}
func (m *mockAuthService) Login(ctx context.Context, email, password, deviceFP, ip string) (string, string, error) {
	args := m.Called(ctx, email, password, deviceFP, ip)
	return args.String(0), args.String(1), args.Error(2)
}
func (m *mockAuthService) Refresh(ctx context.Context, raw string) (string, string, error) {
	args := m.Called(ctx, raw)
	return args.String(0), args.String(1), args.Error(2)
}
func (m *mockAuthService) Logout(ctx context.Context, raw string) error {
	return m.Called(ctx, raw).Error(0)
}
func (m *mockAuthService) Me(ctx context.Context, userID string) (*domain.User, error) {
	args := m.Called(ctx, userID)
	if u, ok := args.Get(0).(*domain.User); ok {
		return u, args.Error(1)
	}
	return nil, args.Error(1)
}

func newRouter(svc handler.AuthService) *gin.Engine {
	gin.SetMode(gin.TestMode)
	h := handler.NewAuthHandler(svc, 7*24*time.Hour)
	r := gin.New()
	r.GET("/api/v1/auth/setup/status", h.SetupStatus)
	r.POST("/api/v1/auth/setup", h.Setup)
	r.POST("/api/v1/auth/login", h.Login)
	r.POST("/api/v1/auth/refresh", h.Refresh)
	r.POST("/api/v1/auth/logout", h.Logout)
	r.GET("/api/v1/auth/me", h.Me)
	return r
}

func TestSetupStatus_ReturnsTrue(t *testing.T) {
	svc := &mockAuthService{}
	svc.On("SetupRequired", mock.Anything).Return(true, nil)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/auth/setup/status", nil)
	newRouter(svc).ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	var body map[string]bool
	json.Unmarshal(w.Body.Bytes(), &body)
	assert.True(t, body["setup_required"])
}

func TestSetup_Success_Returns201(t *testing.T) {
	svc := &mockAuthService{}
	svc.On("Setup", mock.Anything, "Admin", "admin@example.com", "password123").Return(nil)

	body := `{"name":"Admin","email":"admin@example.com","password":"password123"}`
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/auth/setup", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	newRouter(svc).ServeHTTP(w, req)

	assert.Equal(t, http.StatusCreated, w.Code)
}

func TestSetup_AlreadyDone_Returns403(t *testing.T) {
	svc := &mockAuthService{}
	svc.On("Setup", mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(domain.ErrSetupCompleted)

	body := `{"name":"Admin","email":"admin@example.com","password":"password123"}`
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/auth/setup", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	newRouter(svc).ServeHTTP(w, req)

	assert.Equal(t, http.StatusForbidden, w.Code)
}

func TestLogin_InvalidCredentials_Returns401(t *testing.T) {
	svc := &mockAuthService{}
	svc.On("Login", mock.Anything, "bad@example.com", "wrong", mock.Anything, mock.Anything).
		Return("", "", domain.ErrUnauthorized)

	body := `{"email":"bad@example.com","password":"wrong"}`
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/auth/login", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	newRouter(svc).ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestLogin_MissingEmail_Returns400(t *testing.T) {
	svc := &mockAuthService{}
	body := `{"password":"pass"}`
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/auth/login", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	newRouter(svc).ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}
