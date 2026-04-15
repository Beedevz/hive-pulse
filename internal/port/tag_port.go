package port

import (
	"context"

	"github.com/beedevz/hivepulse/internal/domain"
)

type TagRepository interface {
	Create(ctx context.Context, tag *domain.Tag) error
	Delete(ctx context.Context, id string) error
	List(ctx context.Context) ([]*domain.Tag, error)
	FindByID(ctx context.Context, id string) (*domain.Tag, error)
}
