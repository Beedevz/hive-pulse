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

func (r *UserRepo) List(ctx context.Context, page, limit int) ([]*domain.User, int64, error) {
	var models []userModel
	var total int64
	offset := (page - 1) * limit
	if err := r.db.WithContext(ctx).Model(&userModel{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}
	if err := r.db.WithContext(ctx).Offset(offset).Limit(limit).Order("created_at ASC").Find(&models).Error; err != nil {
		return nil, 0, err
	}
	result := make([]*domain.User, len(models))
	for i := range models {
		result[i] = toDomainUser(&models[i])
	}
	return result, total, nil
}

func (r *UserRepo) UpdateRole(ctx context.Context, id string, role domain.Role) error {
	result := r.db.WithContext(ctx).Model(&userModel{}).Where("id = ?", id).Update("role", string(role))
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return domain.ErrNotFound
	}
	return nil
}

func (r *UserRepo) Delete(ctx context.Context, id string) error {
	result := r.db.WithContext(ctx).Delete(&userModel{}, "id = ?", id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return domain.ErrNotFound
	}
	return nil
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
