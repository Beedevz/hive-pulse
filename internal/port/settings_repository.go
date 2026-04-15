package port

import (
	"context"

	"github.com/beedevz/hivepulse/internal/domain"
)

type SettingsRepository interface {
	GetGeneral(ctx context.Context) (*domain.GeneralSettings, error)
	SaveGeneral(ctx context.Context, s *domain.GeneralSettings) error
}
