package service_test

import (
	"context"
	"net"
	"testing"

	"github.com/beedevz/hivepulse/internal/adapter/service"
	"github.com/beedevz/hivepulse/internal/domain"
	"github.com/stretchr/testify/assert"
)

func TestTCPChecker_Up(t *testing.T) {
	ln, _ := net.Listen("tcp", "127.0.0.1:0")
	defer ln.Close()
	addr := ln.Addr().(*net.TCPAddr)

	checker := service.NewTCPChecker()
	m := &domain.Monitor{
		CheckType: domain.CheckTCP,
		Host:      "127.0.0.1",
		Port:      addr.Port,
		Timeout:   5,
	}
	hb, err := checker.Check(context.Background(), m)
	assert.NoError(t, err)
	assert.Equal(t, "up", hb.Status)
	assert.Greater(t, hb.PingMS, -1)
	assert.False(t, hb.CheckedAt.IsZero())
}

func TestTCPChecker_Down(t *testing.T) {
	checker := service.NewTCPChecker()
	m := &domain.Monitor{
		CheckType: domain.CheckTCP,
		Host:      "127.0.0.1",
		Port:      19998,
		Timeout:   1,
	}
	hb, err := checker.Check(context.Background(), m)
	assert.NoError(t, err)
	assert.Equal(t, "down", hb.Status)
	assert.NotEmpty(t, hb.ErrorMsg)
}
