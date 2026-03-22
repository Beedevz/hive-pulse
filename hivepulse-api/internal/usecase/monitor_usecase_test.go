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

func TestCreateMonitor_HTTPValid_Succeeds(t *testing.T) {
	repo := mocks.NewMonitorRepository(t)
	repo.On("Create", mock.Anything, mock.AnythingOfType("*domain.Monitor")).Return(nil)

	uc := usecase.NewMonitorUsecase(repo)
	req := usecase.MonitorRequest{
		Name: "My API", CheckType: "http", URL: "https://example.com",
		Interval: 60, Timeout: 30, Method: "GET", ExpectedStatus: 200,
	}
	err := uc.CreateMonitor(context.Background(), "user-id-1", req)
	assert.NoError(t, err)
}

func TestCreateMonitor_MissingName_Fails(t *testing.T) {
	repo := mocks.NewMonitorRepository(t)
	uc := usecase.NewMonitorUsecase(repo)
	req := usecase.MonitorRequest{CheckType: "http", URL: "https://example.com", Interval: 60}
	err := uc.CreateMonitor(context.Background(), "user-id-1", req)
	assert.ErrorIs(t, err, domain.ErrValidation)
}

func TestCreateMonitor_InvalidInterval_Fails(t *testing.T) {
	repo := mocks.NewMonitorRepository(t)
	uc := usecase.NewMonitorUsecase(repo)
	req := usecase.MonitorRequest{Name: "Test", CheckType: "http", URL: "https://example.com", Interval: 45}
	err := uc.CreateMonitor(context.Background(), "user-id-1", req)
	assert.ErrorIs(t, err, domain.ErrValidation)
}

func TestCreateMonitor_TCPMissingPort_Fails(t *testing.T) {
	repo := mocks.NewMonitorRepository(t)
	uc := usecase.NewMonitorUsecase(repo)
	req := usecase.MonitorRequest{Name: "DB", CheckType: "tcp", Host: "db.example.com", Interval: 60}
	err := uc.CreateMonitor(context.Background(), "user-id-1", req)
	assert.ErrorIs(t, err, domain.ErrValidation)
}

func TestCreateMonitor_PINGValid_Succeeds(t *testing.T) {
	repo := mocks.NewMonitorRepository(t)
	repo.On("Create", mock.Anything, mock.AnythingOfType("*domain.Monitor")).Return(nil)
	uc := usecase.NewMonitorUsecase(repo)
	req := usecase.MonitorRequest{Name: "Ping", CheckType: "ping", PingHost: "8.8.8.8", Interval: 60}
	err := uc.CreateMonitor(context.Background(), "user-id-1", req)
	assert.NoError(t, err)
}

func TestCreateMonitor_DNSMissingRecordType_Fails(t *testing.T) {
	repo := mocks.NewMonitorRepository(t)
	uc := usecase.NewMonitorUsecase(repo)
	req := usecase.MonitorRequest{Name: "DNS", CheckType: "dns", DNSHost: "example.com", Interval: 60}
	err := uc.CreateMonitor(context.Background(), "user-id-1", req)
	assert.ErrorIs(t, err, domain.ErrValidation)
}

func TestGetMonitor_NotFound_ReturnsError(t *testing.T) {
	repo := mocks.NewMonitorRepository(t)
	repo.On("FindByID", mock.Anything, "missing-id").Return((*domain.Monitor)(nil), domain.ErrNotFound)
	uc := usecase.NewMonitorUsecase(repo)
	_, err := uc.GetMonitor(context.Background(), "missing-id")
	assert.ErrorIs(t, err, domain.ErrNotFound)
}

func TestListMonitors_ReturnsPaginatedList(t *testing.T) {
	repo := mocks.NewMonitorRepository(t)
	monitors := []*domain.Monitor{{ID: "m1", Name: "Test", CheckType: domain.CheckHTTP}}
	repo.On("FindAll", mock.Anything, 1, 20).Return(monitors, int64(1), nil)
	uc := usecase.NewMonitorUsecase(repo)
	result, total, err := uc.ListMonitors(context.Background(), 1, 20)
	assert.NoError(t, err)
	assert.Equal(t, int64(1), total)
	assert.Len(t, result, 1)
}

func TestDeleteMonitor_CallsRepo(t *testing.T) {
	repo := mocks.NewMonitorRepository(t)
	repo.On("Delete", mock.Anything, "monitor-id-1").Return(nil)
	uc := usecase.NewMonitorUsecase(repo)
	err := uc.DeleteMonitor(context.Background(), "monitor-id-1")
	assert.NoError(t, err)
}
