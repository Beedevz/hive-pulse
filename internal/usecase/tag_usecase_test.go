package usecase_test

import (
	"context"
	"errors"
	"testing"

	"github.com/beedevz/hivepulse/internal/domain"
	"github.com/beedevz/hivepulse/internal/usecase"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

type mockTagRepo struct{ mock.Mock }

func (m *mockTagRepo) Create(ctx context.Context, tag *domain.Tag) error {
	return m.Called(ctx, tag).Error(0)
}
func (m *mockTagRepo) Delete(ctx context.Context, id string) error {
	return m.Called(ctx, id).Error(0)
}
func (m *mockTagRepo) List(ctx context.Context) ([]*domain.Tag, error) {
	args := m.Called(ctx)
	return args.Get(0).([]*domain.Tag), args.Error(1)
}
func (m *mockTagRepo) FindByID(ctx context.Context, id string) (*domain.Tag, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.Tag), args.Error(1)
}

func TestTagUsecase_Create(t *testing.T) {
	t.Run("creates tag with valid hex color", func(t *testing.T) {
		repo := &mockTagRepo{}
		uc := usecase.NewTagUsecase(repo)
		repo.On("Create", mock.Anything, mock.AnythingOfType("*domain.Tag")).Return(nil)
		tag, err := uc.Create(context.Background(), "Production", "#F5A623")
		assert.NoError(t, err)
		assert.Equal(t, "Production", tag.Name)
		repo.AssertExpectations(t)
	})
	t.Run("rejects invalid hex color", func(t *testing.T) {
		repo := &mockTagRepo{}
		uc := usecase.NewTagUsecase(repo)
		_, err := uc.Create(context.Background(), "Bad", "notacolor")
		assert.Error(t, err)
	})
	t.Run("rejects empty name", func(t *testing.T) {
		repo := &mockTagRepo{}
		uc := usecase.NewTagUsecase(repo)
		_, err := uc.Create(context.Background(), "", "#FFFFFF")
		assert.Error(t, err)
	})
}

func TestTagUsecase_Delete(t *testing.T) {
	repo := &mockTagRepo{}
	uc := usecase.NewTagUsecase(repo)
	repo.On("FindByID", mock.Anything, "tag-1").Return(&domain.Tag{ID: "tag-1"}, nil)
	repo.On("Delete", mock.Anything, "tag-1").Return(nil)
	err := uc.Delete(context.Background(), "tag-1")
	assert.NoError(t, err)
	repo.AssertExpectations(t)
}

func TestTagUsecase_Delete_NotFound(t *testing.T) {
	repo := &mockTagRepo{}
	uc := usecase.NewTagUsecase(repo)
	repo.On("FindByID", mock.Anything, "missing").Return(nil, errors.New("not found"))
	err := uc.Delete(context.Background(), "missing")
	assert.Error(t, err)
}
