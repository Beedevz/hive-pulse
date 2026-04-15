package repo

import (
	"context"
	"encoding/json"

	"github.com/beedevz/hivepulse/internal/domain"
	"github.com/beedevz/hivepulse/internal/port"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type settingRow struct {
	Key   string `gorm:"column:key;primaryKey"`
	Value []byte `gorm:"column:value"`
}

func (settingRow) TableName() string { return "app_settings" }

type SettingsRepo struct{ db *gorm.DB }

func NewSettingsRepo(db *gorm.DB) port.SettingsRepository {
	return &SettingsRepo{db}
}

func (r *SettingsRepo) GetGeneral(ctx context.Context) (*domain.GeneralSettings, error) {
	var row settingRow
	err := r.db.WithContext(ctx).Where("key = ?", "timezone").First(&row).Error
	if err != nil {
		return &domain.GeneralSettings{Timezone: "UTC"}, nil
	}
	var tz string
	if err := json.Unmarshal(row.Value, &tz); err != nil {
		return &domain.GeneralSettings{Timezone: "UTC"}, nil
	}
	return &domain.GeneralSettings{Timezone: tz}, nil
}

func (r *SettingsRepo) SaveGeneral(ctx context.Context, s *domain.GeneralSettings) error {
	b, err := json.Marshal(s.Timezone)
	if err != nil {
		return err
	}
	row := settingRow{Key: "timezone", Value: b}
	return r.db.WithContext(ctx).Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "key"}},
		DoUpdates: clause.AssignmentColumns([]string{"value"}),
	}).Create(&row).Error
}
