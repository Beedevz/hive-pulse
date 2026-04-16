// Copyright (C) 2024 Beedevz. Licensed under AGPL v3 — see LICENSE for details.
package service

import (
	"context"
	"fmt"
	"net"
	"time"

	"github.com/beedevz/hivepulse/internal/domain"
)

type TCPChecker struct{}

func NewTCPChecker() *TCPChecker { return &TCPChecker{} }

func (c *TCPChecker) Check(ctx context.Context, m *domain.Monitor) (*domain.Heartbeat, error) {
	hb := &domain.Heartbeat{
		MonitorID: m.ID,
		CheckedAt: time.Now(),
	}

	addr := fmt.Sprintf("%s:%d", m.Host, m.Port)
	dialer := &net.Dialer{Timeout: time.Duration(m.Timeout) * time.Second}

	start := time.Now()
	conn, err := dialer.DialContext(ctx, "tcp", addr)
	hb.PingMS = int(time.Since(start).Milliseconds())

	if err != nil {
		hb.Status = "down"
		hb.ErrorMsg = err.Error()
		return hb, nil
	}
	_ = conn.Close()
	hb.Status = "up"
	return hb, nil
}
