// Copyright (C) 2024 Beedevz. Licensed under AGPL v3 — see LICENSE for details.
package repo

import (
	"context"
	"errors"
	"time"

	"github.com/beedevz/hivepulse/internal/domain"
	"github.com/beedevz/hivepulse/internal/port"
	"gorm.io/gorm"
)

type tagModel struct {
	ID        string `gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Name      string `gorm:"uniqueIndex;not null"`
	Color     string `gorm:"not null;default:'#6BA3F7'"`
	CreatedAt time.Time
}

func (tagModel) TableName() string { return "tags" }

type TagRepo struct{ db *gorm.DB }

func NewTagRepo(db *gorm.DB) port.TagRepository { return &TagRepo{db} }

func (r *TagRepo) Create(ctx context.Context, tag *domain.Tag) error {
	m := &tagModel{Name: tag.Name, Color: tag.Color}
	if err := r.db.WithContext(ctx).Create(m).Error; err != nil {
		return err
	}
	tag.ID = m.ID
	tag.CreatedAt = m.CreatedAt
	return nil
}

func (r *TagRepo) Delete(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).Delete(&tagModel{}, "id = ?", id).Error
}

func (r *TagRepo) List(ctx context.Context) ([]*domain.Tag, error) {
	var models []tagModel
	if err := r.db.WithContext(ctx).Order("name").Find(&models).Error; err != nil {
		return nil, err
	}
	out := make([]*domain.Tag, len(models))
	for i, m := range models {
		out[i] = &domain.Tag{ID: m.ID, Name: m.Name, Color: m.Color, CreatedAt: m.CreatedAt}
	}
	return out, nil
}

func (r *TagRepo) FindByID(ctx context.Context, id string) (*domain.Tag, error) {
	var m tagModel
	if err := r.db.WithContext(ctx).First(&m, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}
	return &domain.Tag{ID: m.ID, Name: m.Name, Color: m.Color, CreatedAt: m.CreatedAt}, nil
}
