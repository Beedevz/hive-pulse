// Copyright (C) 2024 Beedevz. Licensed under AGPL v3 — see LICENSE for details.
package service

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/beedevz/hivepulse/internal/domain"
)

type SlackSender struct{}

func NewSlackSender() *SlackSender { return &SlackSender{} }

func (s *SlackSender) Send(ctx context.Context, ch *domain.NotificationChannel, event domain.NotificationEvent, monitor *domain.Monitor) error {
	text := formatSlackMessage(event, monitor)
	payload, _ := json.Marshal(map[string]string{"text": text})
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, ch.Config["webhook_url"], bytes.NewReader(payload))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 400 {
		return fmt.Errorf("slack webhook returned status %d", resp.StatusCode)
	}
	return nil
}

func formatSlackMessage(event domain.NotificationEvent, monitor *domain.Monitor) string {
	switch event {
	case domain.EventDown:
		return fmt.Sprintf(":red_circle: *%s* is DOWN", monitor.Name)
	case domain.EventUp:
		return fmt.Sprintf(":large_green_circle: *%s* has recovered (UP)", monitor.Name)
	case domain.EventSSLExpiry:
		return fmt.Sprintf(":warning: *%s* SSL certificate is expiring soon", monitor.Name)
	}
	return fmt.Sprintf("*%s* notification: %s", monitor.Name, event)
}
