package repo

import (
	"context"
	"errors"
	"time"

	"github.com/beedevz/hivepulse/internal/domain"
	"github.com/beedevz/hivepulse/internal/port"
	"gorm.io/gorm"
)

type statusPageModel struct {
	ID           string `gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Slug         string `gorm:"uniqueIndex;not null"`
	Title        string `gorm:"not null"`
	Description  string
	LogoURL      string
	AccentColor  string `gorm:"not null;default:'#F5A623'"`
	CustomDomain string
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

func (statusPageModel) TableName() string { return "status_pages" }

type statusPageTagJoin struct {
	StatusPageID string
	TagID        string
}

func (statusPageTagJoin) TableName() string { return "status_page_tags" }

type StatusPageRepo struct{ db *gorm.DB }

func NewStatusPageRepo(db *gorm.DB) port.StatusPageRepository { return &StatusPageRepo{db} }

func toStatusPageDomain(m *statusPageModel) *domain.StatusPage {
	return &domain.StatusPage{
		ID:           m.ID,
		Slug:         m.Slug,
		Title:        m.Title,
		Description:  m.Description,
		LogoURL:      m.LogoURL,
		AccentColor:  m.AccentColor,
		CustomDomain: m.CustomDomain,
		CreatedAt:    m.CreatedAt,
		UpdatedAt:    m.UpdatedAt,
	}
}

func (r *StatusPageRepo) Create(ctx context.Context, sp *domain.StatusPage) error {
	m := &statusPageModel{
		Slug:         sp.Slug,
		Title:        sp.Title,
		Description:  sp.Description,
		LogoURL:      sp.LogoURL,
		AccentColor:  sp.AccentColor,
		CustomDomain: sp.CustomDomain,
	}
	if err := r.db.WithContext(ctx).Create(m).Error; err != nil {
		return err
	}
	sp.ID = m.ID
	sp.CreatedAt = m.CreatedAt
	sp.UpdatedAt = m.UpdatedAt
	return nil
}

func (r *StatusPageRepo) Update(ctx context.Context, sp *domain.StatusPage) error {
	return r.db.WithContext(ctx).Model(&statusPageModel{}).Where("id = ?", sp.ID).Updates(map[string]interface{}{
		"slug":          sp.Slug,
		"title":         sp.Title,
		"description":   sp.Description,
		"logo_url":      sp.LogoURL,
		"accent_color":  sp.AccentColor,
		"custom_domain": sp.CustomDomain,
		"updated_at":    time.Now(),
	}).Error
}

func (r *StatusPageRepo) Delete(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).Delete(&statusPageModel{}, "id = ?", id).Error
}

func (r *StatusPageRepo) FindByID(ctx context.Context, id string) (*domain.StatusPage, error) {
	var m statusPageModel
	if err := r.db.WithContext(ctx).First(&m, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}
	return toStatusPageDomain(&m), nil
}

func (r *StatusPageRepo) FindBySlug(ctx context.Context, slug string) (*domain.StatusPage, error) {
	var m statusPageModel
	if err := r.db.WithContext(ctx).First(&m, "slug = ?", slug).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}
	return toStatusPageDomain(&m), nil
}

func (r *StatusPageRepo) List(ctx context.Context, page, limit int) ([]*domain.StatusPage, int64, error) {
	var total int64
	r.db.WithContext(ctx).Model(&statusPageModel{}).Count(&total)
	var models []statusPageModel
	offset := (page - 1) * limit
	if err := r.db.WithContext(ctx).Order("created_at DESC").Limit(limit).Offset(offset).Find(&models).Error; err != nil {
		return nil, 0, err
	}
	out := make([]*domain.StatusPage, len(models))
	for i, m := range models {
		m2 := m
		out[i] = toStatusPageDomain(&m2)
	}
	return out, total, nil
}

func (r *StatusPageRepo) SlugExists(ctx context.Context, slug, excludeID string) (bool, error) {
	var count int64
	q := r.db.WithContext(ctx).Model(&statusPageModel{}).Where("slug = ?", slug)
	if excludeID != "" {
		q = q.Where("id != ?", excludeID)
	}
	q.Count(&count)
	return count > 0, nil
}

func (r *StatusPageRepo) SetTags(ctx context.Context, statusPageID string, tagIDs []string) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		tx.Where("status_page_id = ?", statusPageID).Delete(&statusPageTagJoin{})
		for _, tid := range tagIDs {
			tx.Create(&statusPageTagJoin{StatusPageID: statusPageID, TagID: tid})
		}
		return nil
	})
}

func (r *StatusPageRepo) GetTagIDs(ctx context.Context, statusPageID string) ([]string, error) {
	var joins []statusPageTagJoin
	if err := r.db.WithContext(ctx).Where("status_page_id = ?", statusPageID).Find(&joins).Error; err != nil {
		return nil, err
	}
	out := make([]string, len(joins))
	for i, j := range joins {
		out[i] = j.TagID
	}
	return out, nil
}
