package usecase_test

import (
	"context"
	"testing"

	"github.com/beedevz/hivepulse/internal/domain"
	"github.com/beedevz/hivepulse/internal/usecase"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

type mockStatusPageRepo struct{ mock.Mock }

func (m *mockStatusPageRepo) Create(ctx context.Context, sp *domain.StatusPage) error {
	return m.Called(ctx, sp).Error(0)
}
func (m *mockStatusPageRepo) Update(ctx context.Context, sp *domain.StatusPage) error {
	return m.Called(ctx, sp).Error(0)
}
func (m *mockStatusPageRepo) Delete(ctx context.Context, id string) error {
	return m.Called(ctx, id).Error(0)
}
func (m *mockStatusPageRepo) FindByID(ctx context.Context, id string) (*domain.StatusPage, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.StatusPage), args.Error(1)
}
func (m *mockStatusPageRepo) FindBySlug(ctx context.Context, slug string) (*domain.StatusPage, error) {
	args := m.Called(ctx, slug)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.StatusPage), args.Error(1)
}
func (m *mockStatusPageRepo) List(ctx context.Context, page, limit int) ([]*domain.StatusPage, int64, error) {
	args := m.Called(ctx, page, limit)
	return args.Get(0).([]*domain.StatusPage), int64(args.Int(1)), args.Error(2)
}
func (m *mockStatusPageRepo) SlugExists(ctx context.Context, slug, excludeID string) (bool, error) {
	args := m.Called(ctx, slug, excludeID)
	return args.Bool(0), args.Error(1)
}
func (m *mockStatusPageRepo) SetTags(ctx context.Context, id string, tagIDs []string) error {
	return m.Called(ctx, id, tagIDs).Error(0)
}
func (m *mockStatusPageRepo) GetTagIDs(ctx context.Context, id string) ([]string, error) {
	args := m.Called(ctx, id)
	return args.Get(0).([]string), args.Error(1)
}

func TestStatusPageUsecase_Create(t *testing.T) {
	t.Run("auto-generates slug from title", func(t *testing.T) {
		repo := &mockStatusPageRepo{}
		uc := usecase.NewStatusPageUsecase(repo, nil, nil, nil, nil)
		repo.On("SlugExists", mock.Anything, mock.AnythingOfType("string"), "").Return(false, nil)
		repo.On("Create", mock.Anything, mock.AnythingOfType("*domain.StatusPage")).Return(nil)
		repo.On("SetTags", mock.Anything, mock.Anything, mock.Anything).Return(nil)
		sp, err := uc.Create(context.Background(), usecase.StatusPageRequest{
			Title: "My Status", AccentColor: "#F5A623",
		})
		assert.NoError(t, err)
		assert.Contains(t, sp.Slug, "my-status-")
		assert.Len(t, sp.Slug, len("my-status-")+4)
	})
	t.Run("rejects empty title", func(t *testing.T) {
		repo := &mockStatusPageRepo{}
		uc := usecase.NewStatusPageUsecase(repo, nil, nil, nil, nil)
		_, err := uc.Create(context.Background(), usecase.StatusPageRequest{AccentColor: "#F5A623"})
		assert.Error(t, err)
	})
	t.Run("rejects duplicate slug", func(t *testing.T) {
		repo := &mockStatusPageRepo{}
		uc := usecase.NewStatusPageUsecase(repo, nil, nil, nil, nil)
		repo.On("SlugExists", mock.Anything, "custom-slug", "").Return(true, nil)
		_, err := uc.Create(context.Background(), usecase.StatusPageRequest{
			Title: "Test", Slug: "custom-slug", AccentColor: "#F5A623",
		})
		assert.Error(t, err)
	})
}
