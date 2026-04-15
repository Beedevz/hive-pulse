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
	"github.com/stretchr/testify/require"
)

func TestSettingsUsecase_GetGeneral_DefaultsToUTC(t *testing.T) {
	repo := mocks.NewSettingsRepository(t)
	repo.On("GetGeneral", mock.Anything).Return(&domain.GeneralSettings{Timezone: "UTC"}, nil)

	uc := usecase.NewSettingsUsecase(repo)
	gs, err := uc.GetGeneral(context.Background())
	require.NoError(t, err)
	assert.Equal(t, "UTC", gs.Timezone)
}

func TestSettingsUsecase_SaveGeneral(t *testing.T) {
	repo := mocks.NewSettingsRepository(t)
	gs := &domain.GeneralSettings{Timezone: "Europe/Istanbul"}
	repo.On("SaveGeneral", mock.Anything, gs).Return(nil)

	uc := usecase.NewSettingsUsecase(repo)
	err := uc.SaveGeneral(context.Background(), gs)
	require.NoError(t, err)
	repo.AssertCalled(t, "SaveGeneral", mock.Anything, gs)
}
