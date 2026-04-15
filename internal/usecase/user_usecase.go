// Copyright (C) 2024 Beedevz. Licensed under AGPL v3 — see LICENSE for details.
package usecase

import (
	"context"
	"fmt"

	"github.com/beedevz/hivepulse/internal/domain"
	"github.com/beedevz/hivepulse/internal/port"
)

type UserUsecase struct {
	repo port.UserRepository
}

func NewUserUsecase(repo port.UserRepository) *UserUsecase {
	return &UserUsecase{repo: repo}
}

func (u *UserUsecase) ListUsers(ctx context.Context, page, limit int) ([]*domain.User, int64, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	return u.repo.List(ctx, page, limit)
}

func (u *UserUsecase) UpdateRole(ctx context.Context, id string, role domain.Role) error {
	return u.repo.UpdateRole(ctx, id, role)
}

func (u *UserUsecase) DeleteUser(ctx context.Context, targetID, callerID string) error {
	if targetID == callerID {
		return fmt.Errorf("%w: cannot delete self", domain.ErrValidation)
	}
	return u.repo.Delete(ctx, targetID)
}
