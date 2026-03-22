package repo

import (
	"context"
	"errors"
	"time"

	"github.com/beedevz/hivepulse/internal/domain"
	"github.com/beedevz/hivepulse/internal/port"
	"gorm.io/gorm"
)

type tokenModel struct {
	ID        string    `gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	UserID    string    `gorm:"index"`
	TokenHash string    `gorm:"uniqueIndex"`
	DeviceFP  string
	IP        string
	ExpiresAt time.Time `gorm:"index"`
	CreatedAt time.Time
}

func (tokenModel) TableName() string { return "refresh_tokens" }

type TokenRepo struct{ db *gorm.DB }

func NewTokenRepo(db *gorm.DB) port.TokenRepository { return &TokenRepo{db} }

func (r *TokenRepo) Create(ctx context.Context, t *domain.RefreshToken) error {
	m := &tokenModel{
		UserID:    t.UserID,
		TokenHash: t.TokenHash,
		DeviceFP:  t.DeviceFP,
		IP:        t.IP,
		ExpiresAt: t.ExpiresAt,
	}
	return r.db.WithContext(ctx).Create(m).Error
}

func (r *TokenRepo) FindByHash(ctx context.Context, hash string) (*domain.RefreshToken, error) {
	var m tokenModel
	if err := r.db.WithContext(ctx).Where("token_hash = ?", hash).First(&m).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}
	return &domain.RefreshToken{
		ID:        m.ID,
		UserID:    m.UserID,
		TokenHash: m.TokenHash,
		DeviceFP:  m.DeviceFP,
		IP:        m.IP,
		ExpiresAt: m.ExpiresAt,
	}, nil
}

func (r *TokenRepo) DeleteByHash(ctx context.Context, hash string) error {
	return r.db.WithContext(ctx).Where("token_hash = ?", hash).Delete(&tokenModel{}).Error
}

func (r *TokenRepo) DeleteExpired(ctx context.Context) error {
	return r.db.WithContext(ctx).Where("expires_at < ?", time.Now()).Delete(&tokenModel{}).Error
}
