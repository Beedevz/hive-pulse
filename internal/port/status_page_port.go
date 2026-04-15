// Copyright (C) 2024 Beedevz. Licensed under AGPL v3 — see LICENSE for details.
package port

import (
	"context"

	"github.com/beedevz/hivepulse/internal/domain"
)

type StatusPageRepository interface {
	Create(ctx context.Context, sp *domain.StatusPage) error
	Update(ctx context.Context, sp *domain.StatusPage) error
	Delete(ctx context.Context, id string) error
	FindByID(ctx context.Context, id string) (*domain.StatusPage, error)
	FindBySlug(ctx context.Context, slug string) (*domain.StatusPage, error)
	List(ctx context.Context, page, limit int) ([]*domain.StatusPage, int64, error)
	SlugExists(ctx context.Context, slug, excludeID string) (bool, error)
	SetTags(ctx context.Context, statusPageID string, tagIDs []string) error
	GetTagIDs(ctx context.Context, statusPageID string) ([]string, error)
}
