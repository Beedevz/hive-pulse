package usecase

import (
	"context"
	cryptorand "crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"time"

	"github.com/beedevz/hivepulse/internal/domain"
	"github.com/beedevz/hivepulse/internal/port"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type AuthUsecase struct {
	userRepo      port.UserRepository
	tokenRepo     port.TokenRepository
	accessSecret string
	// refreshSecret is reserved for future signed refresh token support.
	refreshSecret string
	accessExpiry  time.Duration
	refreshExpiry time.Duration
}

func NewAuthUsecase(
	userRepo port.UserRepository,
	tokenRepo port.TokenRepository,
	accessSecret, refreshSecret string,
	accessExpiry, refreshExpiry time.Duration,
) *AuthUsecase {
	return &AuthUsecase{
		userRepo:      userRepo,
		tokenRepo:     tokenRepo,
		accessSecret:  accessSecret,
		refreshSecret: refreshSecret,
		accessExpiry:  accessExpiry,
		refreshExpiry: refreshExpiry,
	}
}

func (u *AuthUsecase) SetupRequired(ctx context.Context) (bool, error) {
	count, err := u.userRepo.Count(ctx)
	return count == 0, err
}

func (u *AuthUsecase) Setup(ctx context.Context, name, email, password string) error {
	count, err := u.userRepo.Count(ctx)
	if err != nil {
		return err
	}
	if count > 0 {
		return domain.ErrSetupCompleted
	}
	hash, err := u.HashPassword(password)
	if err != nil {
		return err
	}
	return u.userRepo.Create(ctx, &domain.User{
		Email:        email,
		Name:         name,
		PasswordHash: hash,
		Role:         domain.RoleAdmin,
	})
}

func (u *AuthUsecase) Login(ctx context.Context, email, password, deviceFP, ip string) (accessToken, refreshToken string, err error) {
	user, err := u.userRepo.FindByEmail(ctx, email)
	if err != nil {
		return "", "", domain.ErrUnauthorized
	}
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return "", "", domain.ErrUnauthorized
	}
	accessToken, err = u.generateAccessToken(user)
	if err != nil {
		return "", "", err
	}
	refreshToken, err = u.issueRefreshToken(ctx, user.ID, deviceFP, ip)
	return
}

func (u *AuthUsecase) Refresh(ctx context.Context, rawRefreshToken string) (newAccess, newRefresh string, err error) {
	hash := hashToken(rawRefreshToken)
	stored, err := u.tokenRepo.FindByHash(ctx, hash)
	if err != nil {
		return "", "", domain.ErrUnauthorized
	}
	if stored == nil || time.Now().After(stored.ExpiresAt) {
		return "", "", domain.ErrUnauthorized
	}
	user, err := u.userRepo.FindByID(ctx, stored.UserID)
	if err != nil {
		return "", "", domain.ErrUnauthorized
	}
	if err := u.tokenRepo.DeleteByHash(ctx, hash); err != nil {
		return "", "", err
	}
	newAccess, err = u.generateAccessToken(user)
	if err != nil {
		return "", "", err
	}
	newRefresh, err = u.issueRefreshToken(ctx, user.ID, stored.DeviceFP, stored.IP)
	return
}

func (u *AuthUsecase) Logout(ctx context.Context, rawRefreshToken string) error {
	return u.tokenRepo.DeleteByHash(ctx, hashToken(rawRefreshToken))
}

func (u *AuthUsecase) Me(ctx context.Context, userID string) (*domain.User, error) {
	return u.userRepo.FindByID(ctx, userID)
}

func (u *AuthUsecase) HashPassword(password string) (string, error) {
	b, err := bcrypt.GenerateFromPassword([]byte(password), 12)
	return string(b), err
}

func (u *AuthUsecase) generateAccessToken(user *domain.User) (string, error) {
	claims := jwt.MapClaims{
		"sub":  user.ID,
		"role": string(user.Role),
		"exp":  time.Now().Add(u.accessExpiry).Unix(),
	}
	return jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString([]byte(u.accessSecret))
}

func (u *AuthUsecase) issueRefreshToken(ctx context.Context, userID, deviceFP, ip string) (string, error) {
	raw, err := generateRandomToken()
	if err != nil {
		return "", err
	}
	err = u.tokenRepo.Create(ctx, &domain.RefreshToken{
		UserID:    userID,
		TokenHash: hashToken(raw),
		DeviceFP:  deviceFP,
		IP:        ip,
		ExpiresAt: time.Now().Add(u.refreshExpiry),
	})
	return raw, err
}

func hashToken(raw string) string {
	h := sha256.Sum256([]byte(raw))
	return hex.EncodeToString(h[:])
}

func generateRandomToken() (string, error) {
	b := make([]byte, 32)
	if _, err := cryptorand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}
