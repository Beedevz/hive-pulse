// Copyright (C) 2024 Beedevz. Licensed under AGPL v3 — see LICENSE for details.
package port

import (
	"context"

	"github.com/beedevz/hivepulse/internal/domain"
)

type SettingsRepository interface {
	GetGeneral(ctx context.Context) (*domain.GeneralSettings, error)
	SaveGeneral(ctx context.Context, s *domain.GeneralSettings) error
}
