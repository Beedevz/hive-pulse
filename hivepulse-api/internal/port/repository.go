package port

import (
	"context"
	"github.com/beedevz/hivepulse/internal/domain"
)

type UserRepository interface {
	Create(ctx context.Context, user *domain.User) error
	FindByEmail(ctx context.Context, email string) (*domain.User, error)
	FindByID(ctx context.Context, id string) (*domain.User, error)
	Count(ctx context.Context) (int64, error)
}

type TokenRepository interface {
	Create(ctx context.Context, token *domain.RefreshToken) error
	FindByHash(ctx context.Context, hash string) (*domain.RefreshToken, error)
	DeleteByHash(ctx context.Context, hash string) error
	DeleteExpired(ctx context.Context) error
}
