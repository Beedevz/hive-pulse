// Copyright (C) 2024 Beedevz. Licensed under AGPL v3 — see LICENSE for details.
package usecase_test

import (
	"context"
	"testing"

	"github.com/beedevz/hivepulse/internal/domain"
	"github.com/beedevz/hivepulse/internal/usecase"
	"github.com/beedevz/hivepulse/internal/usecase/mocks"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

func TestListUsers_ReturnsPaginatedList(t *testing.T) {
	repo := mocks.NewUserRepository(t)
	users := []*domain.User{{ID: "u1", Email: "a@a.com", Role: domain.RoleAdmin}}
	repo.On("List", mock.Anything, 1, 20).Return(users, int64(1), nil)

	uc := usecase.NewUserUsecase(repo)
	result, total, err := uc.ListUsers(context.Background(), 1, 20)
	assert.NoError(t, err)
	assert.Equal(t, int64(1), total)
	assert.Len(t, result, 1)
}

func TestUpdateRole_ChangesRole(t *testing.T) {
	repo := mocks.NewUserRepository(t)
	repo.On("UpdateRole", mock.Anything, "u1", domain.RoleEditor).Return(nil)

	uc := usecase.NewUserUsecase(repo)
	err := uc.UpdateRole(context.Background(), "u1", domain.RoleEditor)
	assert.NoError(t, err)
}

func TestDeleteUser_CannotDeleteSelf(t *testing.T) {
	repo := mocks.NewUserRepository(t)
	uc := usecase.NewUserUsecase(repo)
	err := uc.DeleteUser(context.Background(), "u1", "u1")
	assert.ErrorIs(t, err, domain.ErrValidation)
}

func TestDeleteUser_DeletesOther(t *testing.T) {
	repo := mocks.NewUserRepository(t)
	repo.On("Delete", mock.Anything, "u2").Return(nil)

	uc := usecase.NewUserUsecase(repo)
	err := uc.DeleteUser(context.Background(), "u2", "u1")
	assert.NoError(t, err)
}
