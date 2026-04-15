package service

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/beedevz/hivepulse/internal/domain"
)

type WebhookSender struct{}

func NewWebhookSender() *WebhookSender { return &WebhookSender{} }

type webhookPayload struct {
	Event         string `json:"event"`
	MonitorID     string `json:"monitor_id"`
	MonitorName   string `json:"monitor_name"`
	Timestamp     string `json:"timestamp"`
	DaysRemaining *int   `json:"days_remaining,omitempty"`
}

func (s *WebhookSender) Send(ctx context.Context, ch *domain.NotificationChannel, event domain.NotificationEvent, monitor *domain.Monitor) error {
	p := webhookPayload{
		Event:       string(event),
		MonitorID:   monitor.ID,
		MonitorName: monitor.Name,
		Timestamp:   time.Now().UTC().Format(time.RFC3339),
	}
	body, _ := json.Marshal(p)

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, ch.Config["url"], bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	if secret := ch.Config["secret"]; secret != "" {
		mac := hmac.New(sha256.New, []byte(secret))
		mac.Write(body)
		req.Header.Set("X-HivePulse-Signature", "sha256="+hex.EncodeToString(mac.Sum(nil)))
	}
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 400 {
		return fmt.Errorf("webhook returned status %d", resp.StatusCode)
	}
	return nil
}
