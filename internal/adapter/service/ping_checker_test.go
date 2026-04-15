package service_test

import (
	"context"
	"testing"

	"github.com/beedevz/hivepulse/internal/adapter/service"
	"github.com/beedevz/hivepulse/internal/domain"
	"github.com/stretchr/testify/assert"
)

func TestPINGChecker_Loopback(t *testing.T) {
	checker := service.NewPINGChecker()
	m := &domain.Monitor{
		CheckType:   domain.CheckPING,
		PingHost:    "127.0.0.1",
		PacketCount: 1,
		Timeout:     5,
	}
	hb, err := checker.Check(context.Background(), m)
	assert.NoError(t, err)
	// loopback may return "up" or "down" depending on OS permissions; just verify no panic and CheckedAt set
	assert.NotEmpty(t, hb.Status)
	assert.False(t, hb.CheckedAt.IsZero())
}
