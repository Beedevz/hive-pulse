package usecase

import (
	"context"
	"fmt"
	"strings"
	"unicode/utf8"

	"github.com/beedevz/hivepulse/internal/domain"
	"github.com/beedevz/hivepulse/internal/port"
)

type MonitorRequest struct {
	Name          string
	CheckType     string
	Interval      int
	Timeout       int
	Retries       int
	RetryInterval int
	Enabled       bool
	// HTTP
	URL             string
	Method          string
	ExpectedStatus  int
	RequestHeaders  string
	RequestBody     string
	FollowRedirects bool
	// TCP
	Host string
	Port int
	// PING
	PingHost    string
	PacketCount int
	// DNS
	DNSHost       string
	RecordType    string
	ExpectedValue string
	DNSServer     string
}

type MonitorUsecase struct {
	repo      port.MonitorRepository
	scheduler port.SchedulerService
}

func NewMonitorUsecase(repo port.MonitorRepository, scheduler port.SchedulerService) *MonitorUsecase {
	return &MonitorUsecase{repo: repo, scheduler: scheduler}
}

var validIntervals = map[int]bool{
	10: true, 30: true, 60: true, 120: true, 300: true, 600: true, 1800: true, 3600: true,
}

func (u *MonitorUsecase) validate(req MonitorRequest) error {
	if strings.TrimSpace(req.Name) == "" || utf8.RuneCountInString(req.Name) > 100 {
		return fmt.Errorf("%w: name required, max 100 chars", domain.ErrValidation)
	}
	if !validIntervals[req.Interval] {
		return fmt.Errorf("%w: interval must be one of 10,30,60,120,300,600,1800,3600", domain.ErrValidation)
	}
	switch domain.CheckType(req.CheckType) {
	case domain.CheckHTTP:
		if req.URL == "" {
			return fmt.Errorf("%w: url required for http check", domain.ErrValidation)
		}
	case domain.CheckTCP:
		if req.Host == "" || req.Port < 1 || req.Port > 65535 {
			return fmt.Errorf("%w: host and valid port required for tcp check", domain.ErrValidation)
		}
	case domain.CheckPING:
		if req.PingHost == "" {
			return fmt.Errorf("%w: ping_host required for ping check", domain.ErrValidation)
		}
	case domain.CheckDNS:
		if req.DNSHost == "" || req.RecordType == "" {
			return fmt.Errorf("%w: dns_host and record_type required for dns check", domain.ErrValidation)
		}
	default:
		return fmt.Errorf("%w: check_type must be http, tcp, ping, or dns", domain.ErrValidation)
	}
	return nil
}

func reqToMonitor(userID string, req MonitorRequest) *domain.Monitor {
	method := req.Method
	if method == "" {
		method = "GET"
	}
	expectedStatus := req.ExpectedStatus
	if expectedStatus == 0 {
		expectedStatus = 200
	}
	timeout := req.Timeout
	if timeout == 0 {
		timeout = 30
	}
	packetCount := req.PacketCount
	if packetCount == 0 {
		packetCount = 3
	}
	retryInterval := req.RetryInterval
	if retryInterval == 0 {
		retryInterval = 20
	}
	return &domain.Monitor{
		UserID: userID, Name: req.Name, CheckType: domain.CheckType(req.CheckType),
		Interval: req.Interval, Timeout: timeout, Retries: req.Retries,
		RetryInterval: retryInterval, Enabled: req.Enabled,
		URL: req.URL, Method: method, ExpectedStatus: expectedStatus,
		RequestHeaders: req.RequestHeaders, RequestBody: req.RequestBody,
		FollowRedirects: req.FollowRedirects,
		Host: req.Host, Port: req.Port,
		PingHost: req.PingHost, PacketCount: packetCount,
		DNSHost: req.DNSHost, RecordType: req.RecordType,
		ExpectedValue: req.ExpectedValue, DNSServer: req.DNSServer,
	}
}

func (u *MonitorUsecase) CreateMonitor(ctx context.Context, userID string, req MonitorRequest) error {
	if err := u.validate(req); err != nil {
		return err
	}
	m := reqToMonitor(userID, req)
	if err := u.repo.Create(ctx, m); err != nil {
		return err
	}
	if m.Enabled {
		u.scheduler.Add(m)
	}
	return nil
}

func (u *MonitorUsecase) ListMonitors(ctx context.Context, page, limit int) ([]*domain.Monitor, int64, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	return u.repo.FindAll(ctx, page, limit)
}

func (u *MonitorUsecase) GetMonitor(ctx context.Context, id string) (*domain.Monitor, error) {
	return u.repo.FindByID(ctx, id)
}

func (u *MonitorUsecase) UpdateMonitor(ctx context.Context, id string, req MonitorRequest) error {
	if err := u.validate(req); err != nil {
		return err
	}
	m := reqToMonitor("", req)
	m.ID = id
	if err := u.repo.Update(ctx, m); err != nil {
		return err
	}
	u.scheduler.Update(m)
	return nil
}

func (u *MonitorUsecase) DeleteMonitor(ctx context.Context, id string) error {
	u.scheduler.Remove(id)
	return u.repo.Delete(ctx, id)
}
