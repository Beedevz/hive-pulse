package usecase

import (
	"context"

	"github.com/beedevz/hivepulse/internal/domain"
	"github.com/beedevz/hivepulse/internal/port"
)

type SettingsUsecase struct {
	repo port.SettingsRepository
}

func NewSettingsUsecase(repo port.SettingsRepository) *SettingsUsecase {
	return &SettingsUsecase{repo: repo}
}

func (u *SettingsUsecase) GetGeneral(ctx context.Context) (*domain.GeneralSettings, error) {
	return u.repo.GetGeneral(ctx)
}

func (u *SettingsUsecase) SaveGeneral(ctx context.Context, s *domain.GeneralSettings) error {
	return u.repo.SaveGeneral(ctx, s)
}
