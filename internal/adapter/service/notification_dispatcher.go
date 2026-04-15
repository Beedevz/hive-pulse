package service

import (
	"context"
	"fmt"

	"github.com/beedevz/hivepulse/internal/domain"
	"github.com/beedevz/hivepulse/internal/port"
)

type NotificationDispatcher struct {
	email   port.NotificationSender
	webhook port.NotificationSender
	slack   port.NotificationSender
}

func NewNotificationDispatcher(email, webhook, slack port.NotificationSender) *NotificationDispatcher {
	return &NotificationDispatcher{email: email, webhook: webhook, slack: slack}
}

func (d *NotificationDispatcher) Send(ctx context.Context, ch *domain.NotificationChannel, event domain.NotificationEvent, monitor *domain.Monitor) error {
	switch ch.Type {
	case domain.ChannelEmail:
		return d.email.Send(ctx, ch, event, monitor)
	case domain.ChannelWebhook:
		return d.webhook.Send(ctx, ch, event, monitor)
	case domain.ChannelSlack:
		return d.slack.Send(ctx, ch, event, monitor)
	default:
		return fmt.Errorf("unknown channel type: %s", ch.Type)
	}
}
