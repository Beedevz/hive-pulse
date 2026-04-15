// Copyright (C) 2024 Beedevz. Licensed under AGPL v3 — see LICENSE for details.
package handler

import (
	"context"
	"encoding/json"
	"net/http"

	"github.com/beedevz/hivepulse/infrastructure"
	"github.com/beedevz/hivepulse/internal/domain"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// GeneralSettingsService abstracts SettingsUsecase for the handler.
type GeneralSettingsService interface {
	GetGeneral(ctx context.Context) (*domain.GeneralSettings, error)
	SaveGeneral(ctx context.Context, s *domain.GeneralSettings) error
}

// SettingsHandler manages application settings via the API.
type SettingsHandler struct {
	db         *gorm.DB
	cfg        *infrastructure.Config
	settingsUC GeneralSettingsService
}

// NewSettingsHandler creates a new SettingsHandler.
func NewSettingsHandler(db *gorm.DB, cfg *infrastructure.Config, settingsUC GeneralSettingsService) *SettingsHandler {
	return &SettingsHandler{db: db, cfg: cfg, settingsUC: settingsUC}
}

type smtpConfig struct {
	Host     string `json:"host"`
	Port     int    `json:"port"`
	User     string `json:"user"`
	Password string `json:"password"`
	From     string `json:"from"`
}

type appSettingRow struct {
	Key   string `gorm:"column:key;primaryKey"`
	Value []byte `gorm:"column:value"`
}

func (appSettingRow) TableName() string { return "app_settings" }

// GetSMTP godoc
// @Summary     Get SMTP settings
// @Tags        settings
// @Produce     json
// @Success     200  {object}  smtpConfig
// @Failure     500  {object}  map[string]string
// @Security    Bearer
// @Router      /settings/smtp [get]
func (h *SettingsHandler) GetSMTP(c *gin.Context) {
	resp := smtpConfig{
		Host: h.cfg.SMTPHost,
		Port: h.cfg.SMTPPort,
		User: h.cfg.SMTPUser,
		From: h.cfg.SMTPFrom,
	}
	if h.cfg.SMTPPassword != "" {
		resp.Password = "***"
	}
	c.JSON(http.StatusOK, resp)
}

// PutSMTP godoc
// @Summary     Update SMTP settings
// @Tags        settings
// @Accept      json
// @Produce     json
// @Param       body  body      smtpConfig  true  "SMTP configuration"
// @Success     200   {object}  map[string]string
// @Failure     400   {object}  map[string]string
// @Failure     500   {object}  map[string]string
// @Security    Bearer
// @Router      /settings/smtp [put]
func (h *SettingsHandler) PutSMTP(c *gin.Context) {
	var req smtpConfig
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if req.Password == "***" {
		req.Password = h.cfg.SMTPPassword
	}
	if req.Port == 0 {
		req.Port = 587
	}

	b, _ := json.Marshal(req)
	row := appSettingRow{Key: "smtp", Value: b}
	if err := h.db.WithContext(c.Request.Context()).Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "key"}},
		DoUpdates: clause.AssignmentColumns([]string{"value"}),
	}).Create(&row).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save settings"})
		return
	}

	h.cfg.SMTPHost = req.Host
	h.cfg.SMTPPort = req.Port
	h.cfg.SMTPUser = req.User
	h.cfg.SMTPPassword = req.Password
	h.cfg.SMTPFrom = req.From

	c.JSON(http.StatusOK, gin.H{"message": "smtp settings updated"})
}

// GetGeneral godoc
// @Summary     Get general settings
// @Tags        settings
// @Produce     json
// @Success     200  {object}  domain.GeneralSettings
// @Failure     500  {object}  map[string]string
// @Security    Bearer
// @Router      /settings/general [get]
func (h *SettingsHandler) GetGeneral(c *gin.Context) {
	s, err := h.settingsUC.GetGeneral(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load settings"})
		return
	}
	c.JSON(http.StatusOK, s)
}

// PutGeneral godoc
// @Summary     Update general settings
// @Tags        settings
// @Accept      json
// @Produce     json
// @Param       body  body      domain.GeneralSettings  true  "General settings"
// @Success     200   {object}  map[string]string
// @Failure     400   {object}  map[string]string
// @Failure     500   {object}  map[string]string
// @Security    Bearer
// @Router      /settings/general [put]
func (h *SettingsHandler) PutGeneral(c *gin.Context) {
	var req domain.GeneralSettings
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.settingsUC.SaveGeneral(c.Request.Context(), &req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save settings"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "general settings updated"})
}

// LoadSMTPFromDB loads SMTP settings from the database at startup,
// overriding env-var defaults if a saved configuration exists.
func LoadSMTPFromDB(db *gorm.DB, cfg *infrastructure.Config) {
	var row appSettingRow
	if err := db.Where("key = ?", "smtp").First(&row).Error; err != nil {
		return
	}
	var s smtpConfig
	if err := json.Unmarshal(row.Value, &s); err != nil {
		return
	}
	if s.Host != "" {
		cfg.SMTPHost = s.Host
	}
	if s.Port > 0 {
		cfg.SMTPPort = s.Port
	}
	if s.User != "" {
		cfg.SMTPUser = s.User
	}
	if s.Password != "" {
		cfg.SMTPPassword = s.Password
	}
	if s.From != "" {
		cfg.SMTPFrom = s.From
	}
}
