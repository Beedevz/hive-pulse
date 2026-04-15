package service_test

import (
	"context"
	"errors"
	"testing"

	"github.com/beedevz/hivepulse/internal/adapter/service"
	"github.com/beedevz/hivepulse/internal/domain"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

type stubSender struct {
	called bool
	err    error
}

func (s *stubSender) Send(_ context.Context, _ *domain.NotificationChannel, _ domain.NotificationEvent, _ *domain.Monitor) error {
	s.called = true
	return s.err
}

func TestDispatcher_RoutesToEmail(t *testing.T) {
	email := &stubSender{}
	d := service.NewNotificationDispatcher(email, &stubSender{}, &stubSender{})
	ch := &domain.NotificationChannel{Type: domain.ChannelEmail}
	err := d.Send(context.Background(), ch, domain.EventDown, &domain.Monitor{Name: "x"})
	require.NoError(t, err)
	assert.True(t, email.called)
}

func TestDispatcher_RoutesToWebhook(t *testing.T) {
	webhook := &stubSender{}
	d := service.NewNotificationDispatcher(&stubSender{}, webhook, &stubSender{})
	ch := &domain.NotificationChannel{Type: domain.ChannelWebhook}
	err := d.Send(context.Background(), ch, domain.EventDown, &domain.Monitor{Name: "x"})
	require.NoError(t, err)
	assert.True(t, webhook.called)
}

func TestDispatcher_RoutesToSlack(t *testing.T) {
	slack := &stubSender{}
	d := service.NewNotificationDispatcher(&stubSender{}, &stubSender{}, slack)
	ch := &domain.NotificationChannel{Type: domain.ChannelSlack}
	err := d.Send(context.Background(), ch, domain.EventDown, &domain.Monitor{Name: "x"})
	require.NoError(t, err)
	assert.True(t, slack.called)
}

func TestDispatcher_UnknownType_ReturnsError(t *testing.T) {
	d := service.NewNotificationDispatcher(&stubSender{}, &stubSender{}, &stubSender{})
	ch := &domain.NotificationChannel{Type: "fax"}
	err := d.Send(context.Background(), ch, domain.EventDown, &domain.Monitor{})
	assert.Error(t, err)
}

var _ = errors.New // use errors package
