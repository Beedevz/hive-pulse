package usecase_test

import (
	"context"
	"testing"
	"time"

	"github.com/beedevz/hivepulse/internal/domain"
	"github.com/beedevz/hivepulse/internal/usecase"
	"github.com/beedevz/hivepulse/internal/usecase/mocks"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

func TestSetup_WhenNoUsers_CreatesAdmin(t *testing.T) {
	userRepo := mocks.NewUserRepository(t)
	tokenRepo := mocks.NewTokenRepository(t)

	userRepo.On("Count", mock.Anything).Return(int64(0), nil)
	userRepo.On("Create", mock.Anything, mock.AnythingOfType("*domain.User")).Return(nil)

	uc := usecase.NewAuthUsecase(userRepo, tokenRepo, "access-secret", "refresh-secret", 15*time.Minute, 7*24*time.Hour)
	err := uc.Setup(context.Background(), "Admin", "admin@example.com", "password123")

	assert.NoError(t, err)
	userRepo.AssertCalled(t, "Create", mock.Anything, mock.AnythingOfType("*domain.User"))
}

func TestSetup_WhenUsersExist_ReturnsError(t *testing.T) {
	userRepo := mocks.NewUserRepository(t)
	tokenRepo := mocks.NewTokenRepository(t)

	userRepo.On("Count", mock.Anything).Return(int64(1), nil)

	uc := usecase.NewAuthUsecase(userRepo, tokenRepo, "access-secret", "refresh-secret", 15*time.Minute, 7*24*time.Hour)
	err := uc.Setup(context.Background(), "Admin", "admin@example.com", "password123")

	assert.ErrorIs(t, err, domain.ErrSetupCompleted)
}

func TestLogin_WithValidCredentials_ReturnsTokens(t *testing.T) {
	userRepo := mocks.NewUserRepository(t)
	tokenRepo := mocks.NewTokenRepository(t)

	// Pre-hash a known password
	uc := usecase.NewAuthUsecase(userRepo, tokenRepo, "access-secret", "refresh-secret", 15*time.Minute, 7*24*time.Hour)

	hashedPw, _ := uc.HashPassword("secret")
	user := &domain.User{ID: "uuid-1", Email: "admin@example.com", PasswordHash: hashedPw, Role: domain.RoleAdmin}

	userRepo.On("FindByEmail", mock.Anything, "admin@example.com").Return(user, nil)
	tokenRepo.On("Create", mock.Anything, mock.AnythingOfType("*domain.RefreshToken")).Return(nil)

	access, refresh, err := uc.Login(context.Background(), "admin@example.com", "secret", "", "")

	assert.NoError(t, err)
	assert.NotEmpty(t, access)
	assert.NotEmpty(t, refresh)
}

func TestLogin_WithWrongPassword_ReturnsUnauthorized(t *testing.T) {
	userRepo := mocks.NewUserRepository(t)
	tokenRepo := mocks.NewTokenRepository(t)

	uc := usecase.NewAuthUsecase(userRepo, tokenRepo, "access-secret", "refresh-secret", 15*time.Minute, 7*24*time.Hour)
	hashedPw, _ := uc.HashPassword("correct")
	user := &domain.User{ID: "uuid-1", Email: "admin@example.com", PasswordHash: hashedPw}

	userRepo.On("FindByEmail", mock.Anything, "admin@example.com").Return(user, nil)

	_, _, err := uc.Login(context.Background(), "admin@example.com", "wrong", "", "")
	assert.ErrorIs(t, err, domain.ErrUnauthorized)
}
