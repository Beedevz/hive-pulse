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
	return r.db.WithContext(ctx).Model(&monitorModel{}).Where("id = ?", m.ID).Updates(toMonitorModel(m)).Error
}

func (r *MonitorRepo) Delete(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).Delete(&monitorModel{}, "id = ?", id).Error
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
