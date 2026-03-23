package repo

import (
	"context"
	"errors"
	"time"

	"github.com/beedevz/hivepulse/internal/domain"
	"github.com/beedevz/hivepulse/internal/port"
	"gorm.io/gorm"
)

type monitorModel struct {
	ID              string `gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	UserID          string `gorm:"type:uuid;not null"`
	Name            string
	CheckType       string
	Interval        int
	Timeout         int
	Retries         int
	RetryInterval   int
	Enabled         bool
	URL             string
	Method          string
	ExpectedStatus  int
	RequestHeaders  string
	RequestBody     string
	FollowRedirects bool
	Host            string
	Port            int
	PingHost        string
	PacketCount     int
	DNSHost         string
	RecordType      string
	ExpectedValue   string
	DNSServer       string
	CreatedAt       time.Time
	UpdatedAt       time.Time
}

func (monitorModel) TableName() string { return "monitors" }

type MonitorRepo struct{ db *gorm.DB }

func NewMonitorRepo(db *gorm.DB) port.MonitorRepository { return &MonitorRepo{db} }

func (r *MonitorRepo) Create(ctx context.Context, m *domain.Monitor) error {
	model := toMonitorModel(m)
	if err := r.db.WithContext(ctx).Create(model).Error; err != nil {
		return err
	}
	m.ID = model.ID
	return nil
}

func (r *MonitorRepo) FindByID(ctx context.Context, id string) (*domain.Monitor, error) {
	var m monitorModel
	if err := r.db.WithContext(ctx).First(&m, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}
	return toDomainMonitor(&m), nil
}

func (r *MonitorRepo) FindAll(ctx context.Context, page, limit int) ([]*domain.Monitor, int64, error) {
	var models []monitorModel
	var total int64
	offset := (page - 1) * limit
	if err := r.db.WithContext(ctx).Model(&monitorModel{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}
	if err := r.db.WithContext(ctx).Offset(offset).Limit(limit).Order("created_at DESC").Find(&models).Error; err != nil {
		return nil, 0, err
	}
	result := make([]*domain.Monitor, len(models))
	for i := range models {
		result[i] = toDomainMonitor(&models[i])
	}
	return result, total, nil
}

func (r *MonitorRepo) Update(ctx context.Context, m *domain.Monitor) error {
	updates := map[string]any{
		"name":             m.Name,
		"check_type":       string(m.CheckType),
		"interval":         m.Interval,
		"timeout":          m.Timeout,
		"retries":          m.Retries,
		"retry_interval":   m.RetryInterval,
		"enabled":          m.Enabled,
		"url":              m.URL,
		"method":           m.Method,
		"expected_status":  m.ExpectedStatus,
		"request_headers":  m.RequestHeaders,
		"request_body":     m.RequestBody,
		"follow_redirects": m.FollowRedirects,
		"host":             m.Host,
		"port":             m.Port,
		"ping_host":        m.PingHost,
		"packet_count":     m.PacketCount,
		"dns_host":         m.DNSHost,
		"record_type":      m.RecordType,
		"expected_value":   m.ExpectedValue,
		"dns_server":       m.DNSServer,
	}
	result := r.db.WithContext(ctx).Model(&monitorModel{}).Where("id = ?", m.ID).Updates(updates)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return domain.ErrNotFound
	}
	return nil
}

func (r *MonitorRepo) Delete(ctx context.Context, id string) error {
	result := r.db.WithContext(ctx).Delete(&monitorModel{}, "id = ?", id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return domain.ErrNotFound
	}
	return nil
}

func toMonitorModel(m *domain.Monitor) *monitorModel {
	return &monitorModel{
		ID:              m.ID,
		UserID:          m.UserID,
		Name:            m.Name,
		CheckType:       string(m.CheckType),
		Interval:        m.Interval,
		Timeout:         m.Timeout,
		Retries:         m.Retries,
		RetryInterval:   m.RetryInterval,
		Enabled:         m.Enabled,
		URL:             m.URL,
		Method:          m.Method,
		ExpectedStatus:  m.ExpectedStatus,
		RequestHeaders:  m.RequestHeaders,
		RequestBody:     m.RequestBody,
		FollowRedirects: m.FollowRedirects,
		Host:            m.Host,
		Port:            m.Port,
		PingHost:        m.PingHost,
		PacketCount:     m.PacketCount,
		DNSHost:         m.DNSHost,
		RecordType:      m.RecordType,
		ExpectedValue:   m.ExpectedValue,
		DNSServer:       m.DNSServer,
	}
}

func (r *MonitorRepo) FindAllEnabled(ctx context.Context) ([]*domain.Monitor, error) {
	var models []monitorModel
	if err := r.db.WithContext(ctx).Where("enabled = true").Find(&models).Error; err != nil {
		return nil, err
	}
	result := make([]*domain.Monitor, len(models))
	for i := range models {
		result[i] = toDomainMonitor(&models[i])
	}
	return result, nil
}

func toDomainMonitor(m *monitorModel) *domain.Monitor {
	return &domain.Monitor{
		ID:              m.ID,
		UserID:          m.UserID,
		Name:            m.Name,
		CheckType:       domain.CheckType(m.CheckType),
		Interval:        m.Interval,
		Timeout:         m.Timeout,
		Retries:         m.Retries,
		RetryInterval:   m.RetryInterval,
		Enabled:         m.Enabled,
		URL:             m.URL,
		Method:          m.Method,
		ExpectedStatus:  m.ExpectedStatus,
		RequestHeaders:  m.RequestHeaders,
		RequestBody:     m.RequestBody,
		FollowRedirects: m.FollowRedirects,
		Host:            m.Host,
		Port:            m.Port,
		PingHost:        m.PingHost,
		PacketCount:     m.PacketCount,
		DNSHost:         m.DNSHost,
		RecordType:      m.RecordType,
		ExpectedValue:   m.ExpectedValue,
		DNSServer:       m.DNSServer,
		CreatedAt:       m.CreatedAt,
		UpdatedAt:       m.UpdatedAt,
	}
}
