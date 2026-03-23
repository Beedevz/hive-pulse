package usecase_test

import (
	"context"
	"testing"
	"time"

	"github.com/beedevz/hivepulse/internal/domain"
	"github.com/beedevz/hivepulse/internal/port"
	"github.com/beedevz/hivepulse/internal/usecase"
	"github.com/beedevz/hivepulse/internal/usecase/mocks"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

func TestRunCheck_Up_StoresAndBroadcasts(t *testing.T) {
	monitorRepo := mocks.NewMonitorRepository(t)
	heartbeatRepo := mocks.NewHeartbeatRepository(t)
	checkerSvc := mocks.NewCheckerService(t)
	broadcaster := mocks.NewWSBroadcaster(t)

	m := &domain.Monitor{ID: "m1", CheckType: domain.CheckHTTP, Enabled: true, Retries: 0}
	hb := &domain.Heartbeat{Status: "up", PingMS: 42, CheckedAt: time.Now()}

	monitorRepo.On("FindByID", mock.Anything, "m1").Return(m, nil)
	checkerSvc.On("Check", mock.Anything, m).Return(hb, nil)
	heartbeatRepo.On("Create", mock.Anything, mock.AnythingOfType("*domain.Heartbeat")).Return(nil)
	broadcaster.On("Broadcast", mock.AnythingOfType("[]uint8")).Return()

	uc := usecase.NewCheckerUsecase(monitorRepo, heartbeatRepo,
		map[domain.CheckType]port.CheckerService{
			domain.CheckHTTP: checkerSvc,
		}, broadcaster)

	uc.RunCheck(context.Background(), "m1")

	monitorRepo.AssertExpectations(t)
	heartbeatRepo.AssertExpectations(t)
	broadcaster.AssertExpectations(t)
}

func TestRunCheck_DisabledMonitor_Skips(t *testing.T) {
	monitorRepo := mocks.NewMonitorRepository(t)
	heartbeatRepo := mocks.NewHeartbeatRepository(t)
	broadcaster := mocks.NewWSBroadcaster(t)

	m := &domain.Monitor{ID: "m2", Enabled: false}
	monitorRepo.On("FindByID", mock.Anything, "m2").Return(m, nil)

	uc := usecase.NewCheckerUsecase(monitorRepo, heartbeatRepo, nil, broadcaster)
	uc.RunCheck(context.Background(), "m2")

	heartbeatRepo.AssertNotCalled(t, "Create")
	broadcaster.AssertNotCalled(t, "Broadcast")
}

func TestRunCheck_AllRetriesFail_StoresDown(t *testing.T) {
	monitorRepo := mocks.NewMonitorRepository(t)
	heartbeatRepo := mocks.NewHeartbeatRepository(t)
	checkerSvc := mocks.NewCheckerService(t)
	broadcaster := mocks.NewWSBroadcaster(t)

	m := &domain.Monitor{ID: "m3", CheckType: domain.CheckHTTP, Enabled: true, Retries: 2, RetryInterval: 0}
	downHB := &domain.Heartbeat{Status: "down", ErrorMsg: "refused", CheckedAt: time.Now()}

	monitorRepo.On("FindByID", mock.Anything, "m3").Return(m, nil)
	// called 3 times: 1 initial + 2 retries
	checkerSvc.On("Check", mock.Anything, m).Return(downHB, nil).Times(3)
	heartbeatRepo.On("Create", mock.Anything, mock.AnythingOfType("*domain.Heartbeat")).Return(nil)
	broadcaster.On("Broadcast", mock.AnythingOfType("[]uint8")).Return()

	uc := usecase.NewCheckerUsecase(monitorRepo, heartbeatRepo,
		map[domain.CheckType]port.CheckerService{
			domain.CheckHTTP: checkerSvc,
		}, broadcaster)

	uc.RunCheck(context.Background(), "m3")

	checkerSvc.AssertNumberOfCalls(t, "Check", 3)
	heartbeatRepo.AssertCalled(t, "Create", mock.Anything, mock.MatchedBy(func(h *domain.Heartbeat) bool {
		return h.Status == "down"
	}))
}

// Ensure assert is used (avoids import error if no direct assertion is made).
var _ = assert.New
