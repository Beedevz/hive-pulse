// Copyright (C) 2024 Beedevz. Licensed under AGPL v3 — see LICENSE for details.
package usecase

import (
	"context"
	"fmt"
	"regexp"
	"strings"

	"github.com/beedevz/hivepulse/internal/domain"
	"github.com/beedevz/hivepulse/internal/port"
)

var hexColorRe = regexp.MustCompile(`^#[0-9A-Fa-f]{6}$`)

type TagUsecase struct {
	repo port.TagRepository
}

func NewTagUsecase(repo port.TagRepository) *TagUsecase {
	return &TagUsecase{repo: repo}
}

func (u *TagUsecase) Create(ctx context.Context, name, color string) (*domain.Tag, error) {
	name = strings.TrimSpace(name)
	if name == "" {
		return nil, fmt.Errorf("%w: name is required", domain.ErrValidation)
	}
	if !hexColorRe.MatchString(color) {
		return nil, fmt.Errorf("%w: color must be a valid hex color (e.g. #F5A623)", domain.ErrValidation)
	}
	tag := &domain.Tag{Name: name, Color: color}
	if err := u.repo.Create(ctx, tag); err != nil {
		return nil, err
	}
	return tag, nil
}

func (u *TagUsecase) Delete(ctx context.Context, id string) error {
	if _, err := u.repo.FindByID(ctx, id); err != nil {
		return fmt.Errorf("%w", domain.ErrNotFound)
	}
	return u.repo.Delete(ctx, id)
}

func (u *TagUsecase) List(ctx context.Context) ([]*domain.Tag, error) {
	return u.repo.List(ctx)
}
