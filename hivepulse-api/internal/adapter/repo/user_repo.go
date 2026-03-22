package repo

import (
	"context"
	"errors"
	"time"

	"github.com/beedevz/hivepulse/internal/domain"
	"github.com/beedevz/hivepulse/internal/port"
	"gorm.io/gorm"
)

type userModel struct {
	ID           string    `gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Email        string    `gorm:"uniqueIndex"`
	Name         string
	PasswordHash string
	Role         string
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

func (userModel) TableName() string { return "users" }

type UserRepo struct{ db *gorm.DB }

func NewUserRepo(db *gorm.DB) port.UserRepository { return &UserRepo{db} }

func (r *UserRepo) Create(ctx context.Context, u *domain.User) error {
	m := &userModel{Email: u.Email, Name: u.Name, PasswordHash: u.PasswordHash, Role: string(u.Role)}
	if err := r.db.WithContext(ctx).Create(m).Error; err != nil {
		return err
	}
	u.ID = m.ID
	return nil
}

func (r *UserRepo) FindByEmail(ctx context.Context, email string) (*domain.User, error) {
	var m userModel
	if err := r.db.WithContext(ctx).Where("email = ?", email).First(&m).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}
	return toDomainUser(&m), nil
}

func (r *UserRepo) FindByID(ctx context.Context, id string) (*domain.User, error) {
	var m userModel
	if err := r.db.WithContext(ctx).First(&m, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}
	return toDomainUser(&m), nil
}

func (r *UserRepo) Count(ctx context.Context) (int64, error) {
	var count int64
	return count, r.db.WithContext(ctx).Model(&userModel{}).Count(&count).Error
}

func toDomainUser(m *userModel) *domain.User {
	return &domain.User{
		ID:           m.ID,
		Email:        m.Email,
		Name:         m.Name,
		PasswordHash: m.PasswordHash,
		Role:         domain.Role(m.Role),
		CreatedAt:    m.CreatedAt,
		UpdatedAt:    m.UpdatedAt,
	}
}
