// Copyright (C) 2024 Beedevz. Licensed under AGPL v3 — see LICENSE for details.
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
	incidentRepo := mocks.NewIncidentRepository(t)
	checkerSvc := mocks.NewCheckerService(t)
	broadcaster := mocks.NewWSBroadcaster(t)

	m := &domain.Monitor{ID: "m1", CheckType: domain.CheckHTTP, Enabled: true, Retries: 0}
	hb := &domain.Heartbeat{Status: "up", PingMS: 42, CheckedAt: time.Now()}

	monitorRepo.On("FindByID", mock.Anything, "m1").Return(m, nil)
	checkerSvc.On("Check", mock.Anything, m).Return(hb, nil)
	heartbeatRepo.On("Create", mock.Anything, mock.AnythingOfType("*domain.Heartbeat")).Return(nil)
	monitorRepo.On("UpdateLastStatus", mock.Anything, "m1", "up").Return(nil)
	broadcaster.On("Broadcast", mock.AnythingOfType("[]uint8")).Return()

	uc := usecase.NewCheckerUsecase(monitorRepo, heartbeatRepo, incidentRepo,
		map[domain.CheckType]port.CheckerService{
			domain.CheckHTTP: checkerSvc,
		}, broadcaster, nil)

	uc.RunCheck(context.Background(), "m1")

	monitorRepo.AssertExpectations(t)
	heartbeatRepo.AssertExpectations(t)
	broadcaster.AssertExpectations(t)
}

func TestRunCheck_DisabledMonitor_Skips(t *testing.T) {
	monitorRepo := mocks.NewMonitorRepository(t)
	heartbeatRepo := mocks.NewHeartbeatRepository(t)
	incidentRepo := mocks.NewIncidentRepository(t)
	broadcaster := mocks.NewWSBroadcaster(t)

	m := &domain.Monitor{ID: "m2", Enabled: false}
	monitorRepo.On("FindByID", mock.Anything, "m2").Return(m, nil)

	uc := usecase.NewCheckerUsecase(monitorRepo, heartbeatRepo, incidentRepo, nil, broadcaster, nil)
	uc.RunCheck(context.Background(), "m2")

	heartbeatRepo.AssertNotCalled(t, "Create")
	broadcaster.AssertNotCalled(t, "Broadcast")
}

func TestRunCheck_AllRetriesFail_StoresDown(t *testing.T) {
	monitorRepo := mocks.NewMonitorRepository(t)
	heartbeatRepo := mocks.NewHeartbeatRepository(t)
	incidentRepo := mocks.NewIncidentRepository(t)
	checkerSvc := mocks.NewCheckerService(t)
	broadcaster := mocks.NewWSBroadcaster(t)

	m := &domain.Monitor{ID: "m3", CheckType: domain.CheckHTTP, Enabled: true, Retries: 2, RetryInterval: 0}
	downHB := &domain.Heartbeat{Status: "down", ErrorMsg: "refused", CheckedAt: time.Now()}

	monitorRepo.On("FindByID", mock.Anything, "m3").Return(m, nil)
	// called 3 times: 1 initial + 2 retries
	checkerSvc.On("Check", mock.Anything, m).Return(downHB, nil).Times(3)
	heartbeatRepo.On("Create", mock.Anything, mock.AnythingOfType("*domain.Heartbeat")).Return(nil)
	monitorRepo.On("UpdateLastStatus", mock.Anything, "m3", "down").Return(nil)
	incidentRepo.On("Create", mock.Anything, mock.AnythingOfType("*domain.Incident")).Return(nil)
	broadcaster.On("Broadcast", mock.AnythingOfType("[]uint8")).Return()

	uc := usecase.NewCheckerUsecase(monitorRepo, heartbeatRepo, incidentRepo,
		map[domain.CheckType]port.CheckerService{
			domain.CheckHTTP: checkerSvc,
		}, broadcaster, nil)

	uc.RunCheck(context.Background(), "m3")

	checkerSvc.AssertNumberOfCalls(t, "Check", 3)
	heartbeatRepo.AssertCalled(t, "Create", mock.Anything, mock.MatchedBy(func(h *domain.Heartbeat) bool {
		return h.Status == "down"
	}))
}

func TestRunCheck_UpToDown_OpensIncident(t *testing.T) {
	monitorRepo := mocks.NewMonitorRepository(t)
	heartbeatRepo := mocks.NewHeartbeatRepository(t)
	incidentRepo := mocks.NewIncidentRepository(t)
	checkerSvc := mocks.NewCheckerService(t)
	broadcaster := mocks.NewWSBroadcaster(t)

	m := &domain.Monitor{
		ID: "m1", CheckType: domain.CheckHTTP, Enabled: true,
		Name: "API", LastStatus: "up",
	}
	downHB := &domain.Heartbeat{Status: "down", ErrorMsg: "refused", CheckedAt: time.Now()}

	monitorRepo.On("FindByID", mock.Anything, "m1").Return(m, nil)
	checkerSvc.On("Check", mock.Anything, m).Return(downHB, nil)
	heartbeatRepo.On("Create", mock.Anything, mock.AnythingOfType("*domain.Heartbeat")).Return(nil)
	monitorRepo.On("UpdateLastStatus", mock.Anything, "m1", "down").Return(nil)
	incidentRepo.On("Create", mock.Anything, mock.MatchedBy(func(inc *domain.Incident) bool {
		return inc.MonitorID == "m1" && inc.MonitorName == "API" && inc.ErrorMsg == "refused"
	})).Return(nil)
	broadcaster.On("Broadcast", mock.AnythingOfType("[]uint8")).Return()

	uc := usecase.NewCheckerUsecase(monitorRepo, heartbeatRepo, incidentRepo,
		map[domain.CheckType]port.CheckerService{domain.CheckHTTP: checkerSvc}, broadcaster, nil)
	uc.RunCheck(context.Background(), "m1")

	incidentRepo.AssertExpectations(t)
}

func TestRunCheck_DownToUp_ResolvesIncident(t *testing.T) {
	monitorRepo := mocks.NewMonitorRepository(t)
	heartbeatRepo := mocks.NewHeartbeatRepository(t)
	incidentRepo := mocks.NewIncidentRepository(t)
	checkerSvc := mocks.NewCheckerService(t)
	broadcaster := mocks.NewWSBroadcaster(t)

	m := &domain.Monitor{
		ID: "m2", CheckType: domain.CheckHTTP, Enabled: true,
		Name: "DB", LastStatus: "down",
	}
	upHB := &domain.Heartbeat{Status: "up", PingMS: 50, CheckedAt: time.Now()}

	monitorRepo.On("FindByID", mock.Anything, "m2").Return(m, nil)
	checkerSvc.On("Check", mock.Anything, m).Return(upHB, nil)
	heartbeatRepo.On("Create", mock.Anything, mock.AnythingOfType("*domain.Heartbeat")).Return(nil)
	monitorRepo.On("UpdateLastStatus", mock.Anything, "m2", "up").Return(nil)
	incidentRepo.On("Resolve", mock.Anything, "m2", mock.AnythingOfType("time.Time")).Return(nil)
	broadcaster.On("Broadcast", mock.AnythingOfType("[]uint8")).Return()

	uc := usecase.NewCheckerUsecase(monitorRepo, heartbeatRepo, incidentRepo,
		map[domain.CheckType]port.CheckerService{domain.CheckHTTP: checkerSvc}, broadcaster, nil)
	uc.RunCheck(context.Background(), "m2")

	incidentRepo.AssertExpectations(t)
}

func TestRunCheck_DownToDown_NoNewIncident(t *testing.T) {
	monitorRepo := mocks.NewMonitorRepository(t)
	heartbeatRepo := mocks.NewHeartbeatRepository(t)
	incidentRepo := mocks.NewIncidentRepository(t)
	checkerSvc := mocks.NewCheckerService(t)
	broadcaster := mocks.NewWSBroadcaster(t)

	m := &domain.Monitor{
		ID: "m3", CheckType: domain.CheckHTTP, Enabled: true,
		Name: "Cache", LastStatus: "down",
	}
	downHB := &domain.Heartbeat{Status: "down", ErrorMsg: "timeout", CheckedAt: time.Now()}

	monitorRepo.On("FindByID", mock.Anything, "m3").Return(m, nil)
	checkerSvc.On("Check", mock.Anything, m).Return(downHB, nil)
	heartbeatRepo.On("Create", mock.Anything, mock.AnythingOfType("*domain.Heartbeat")).Return(nil)
	monitorRepo.On("UpdateLastStatus", mock.Anything, "m3", "down").Return(nil)
	broadcaster.On("Broadcast", mock.AnythingOfType("[]uint8")).Return()
	// incidentRepo.Create must NOT be called

	uc := usecase.NewCheckerUsecase(monitorRepo, heartbeatRepo, incidentRepo,
		map[domain.CheckType]port.CheckerService{domain.CheckHTTP: checkerSvc}, broadcaster, nil)
	uc.RunCheck(context.Background(), "m3")

	incidentRepo.AssertNotCalled(t, "Create")
}

func TestRunCheck_UnknownToDown_OpensIncident(t *testing.T) {
	monitorRepo := mocks.NewMonitorRepository(t)
	heartbeatRepo := mocks.NewHeartbeatRepository(t)
	incidentRepo := mocks.NewIncidentRepository(t)
	checkerSvc := mocks.NewCheckerService(t)
	broadcaster := mocks.NewWSBroadcaster(t)

	m := &domain.Monitor{
		ID: "m4", CheckType: domain.CheckHTTP, Enabled: true,
		Name: "New", LastStatus: "unknown",
	}
	downHB := &domain.Heartbeat{Status: "down", ErrorMsg: "unreachable", CheckedAt: time.Now()}

	monitorRepo.On("FindByID", mock.Anything, "m4").Return(m, nil)
	checkerSvc.On("Check", mock.Anything, m).Return(downHB, nil)
	heartbeatRepo.On("Create", mock.Anything, mock.AnythingOfType("*domain.Heartbeat")).Return(nil)
	monitorRepo.On("UpdateLastStatus", mock.Anything, "m4", "down").Return(nil)
	incidentRepo.On("Create", mock.Anything, mock.AnythingOfType("*domain.Incident")).Return(nil)
	broadcaster.On("Broadcast", mock.AnythingOfType("[]uint8")).Return()

	uc := usecase.NewCheckerUsecase(monitorRepo, heartbeatRepo, incidentRepo,
		map[domain.CheckType]port.CheckerService{domain.CheckHTTP: checkerSvc}, broadcaster, nil)
	uc.RunCheck(context.Background(), "m4")

	incidentRepo.AssertCalled(t, "Create", mock.Anything, mock.AnythingOfType("*domain.Incident"))
}

type stubCheckerService struct {
	status string
	pingMS int
}

func (s *stubCheckerService) Check(_ context.Context, _ *domain.Monitor) (*domain.Heartbeat, error) {
	return &domain.Heartbeat{Status: s.status, PingMS: s.pingMS, CheckedAt: time.Now()}, nil
}

type stubHub struct{}

func (h *stubHub) Broadcast(_ []byte) {}

func TestRunCheck_Down_CallsNotifier(t *testing.T) {
	monitorRepo := mocks.NewMonitorRepository(t)
	heartbeatRepo := mocks.NewHeartbeatRepository(t)
	incidentRepo := mocks.NewIncidentRepository(t)
	notifier := mocks.NewNotifier(t)

	monitor := &domain.Monitor{ID: "m1", Name: "API", LastStatus: "up", Enabled: true, CheckType: domain.CheckHTTP}
	monitorRepo.On("FindByID", mock.Anything, "m1").Return(monitor, nil)
	monitorRepo.On("UpdateLastStatus", mock.Anything, "m1", "down").Return(nil)
	heartbeatRepo.On("Create", mock.Anything, mock.Anything).Return(nil)
	incidentRepo.On("Create", mock.Anything, mock.Anything).Return(nil)
	notifier.On("Notify", mock.Anything, "m1", domain.EventDown).Return()

	stubChecker := &stubCheckerService{status: "down", pingMS: 0}
	uc := usecase.NewCheckerUsecase(monitorRepo, heartbeatRepo, incidentRepo,
		map[domain.CheckType]port.CheckerService{domain.CheckHTTP: stubChecker}, &stubHub{}, nil)
	uc.SetNotifier(notifier)
	uc.RunCheck(context.Background(), "m1")

	time.Sleep(50 * time.Millisecond)
	notifier.AssertCalled(t, "Notify", mock.Anything, "m1", domain.EventDown)
}

func TestRunCheck_Recovery_CallsNotifier(t *testing.T) {
	monitorRepo := mocks.NewMonitorRepository(t)
	heartbeatRepo := mocks.NewHeartbeatRepository(t)
	incidentRepo := mocks.NewIncidentRepository(t)
	notifier := mocks.NewNotifier(t)

	monitor := &domain.Monitor{ID: "m1", Name: "API", LastStatus: "down", Enabled: true, CheckType: domain.CheckHTTP}
	monitorRepo.On("FindByID", mock.Anything, "m1").Return(monitor, nil)
	monitorRepo.On("UpdateLastStatus", mock.Anything, "m1", "up").Return(nil)
	heartbeatRepo.On("Create", mock.Anything, mock.Anything).Return(nil)
	incidentRepo.On("Resolve", mock.Anything, "m1", mock.Anything).Return(nil)
	notifier.On("Notify", mock.Anything, "m1", domain.EventUp).Return()

	stubChecker := &stubCheckerService{status: "up", pingMS: 100}
	uc := usecase.NewCheckerUsecase(monitorRepo, heartbeatRepo, incidentRepo,
		map[domain.CheckType]port.CheckerService{domain.CheckHTTP: stubChecker}, &stubHub{}, nil)
	uc.SetNotifier(notifier)
	uc.RunCheck(context.Background(), "m1")

	time.Sleep(50 * time.Millisecond)
	notifier.AssertCalled(t, "Notify", mock.Anything, "m1", domain.EventUp)
}

func TestRunCheck_InMaintenance_SkipsIncident(t *testing.T) {
	monitorRepo := mocks.NewMonitorRepository(t)
	heartbeatRepo := mocks.NewHeartbeatRepository(t)
	incidentRepo := mocks.NewIncidentRepository(t)
	maintenanceRepo := mocks.NewMaintenanceWindowRepository(t)

	m := &domain.Monitor{
		ID: "m1", CheckType: domain.CheckHTTP, Enabled: true,
		Name: "API", LastStatus: "up",
	}

	monitorRepo.On("FindByID", mock.Anything, "m1").Return(m, nil)
	heartbeatRepo.On("Create", mock.Anything, mock.AnythingOfType("*domain.Heartbeat")).Return(nil)
	maintenanceRepo.On("IsMonitorInMaintenance", mock.Anything, "m1", mock.AnythingOfType("time.Time")).Return(true, nil)
	monitorRepo.On("UpdateLastStatus", mock.Anything, "m1", "maintenance").Return(nil)

	stubChecker := &stubCheckerService{status: "down", pingMS: 0}
	uc := usecase.NewCheckerUsecase(monitorRepo, heartbeatRepo, incidentRepo,
		map[domain.CheckType]port.CheckerService{domain.CheckHTTP: stubChecker}, &stubHub{}, maintenanceRepo)
	uc.RunCheck(context.Background(), "m1")

	incidentRepo.AssertNotCalled(t, "Create")
	monitorRepo.AssertCalled(t, "UpdateLastStatus", mock.Anything, "m1", "maintenance")
}

// Ensure assert is used (avoids import error if no direct assertion is made).
var _ = assert.New
