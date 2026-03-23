package service

import (
	"context"
	"time"

	probing "github.com/prometheus-community/pro-bing"
	"github.com/beedevz/hivepulse/internal/domain"
)

type PINGChecker struct{}

func NewPINGChecker() *PINGChecker { return &PINGChecker{} }

func (c *PINGChecker) Check(ctx context.Context, m *domain.Monitor) (*domain.Heartbeat, error) {
	hb := &domain.Heartbeat{
		MonitorID: m.ID,
		CheckedAt: time.Now(),
	}

	count := m.PacketCount
	if count <= 0 {
		count = 3
	}

	pinger, err := probing.NewPinger(m.PingHost)
	if err != nil {
		hb.Status = "down"
		hb.ErrorMsg = err.Error()
		return hb, nil
	}
	pinger.Count = count
	pinger.Timeout = time.Duration(m.Timeout) * time.Second
	pinger.SetPrivileged(false) // unprivileged UDP ICMP (no root needed)

	if err := pinger.RunWithContext(ctx); err != nil {
		hb.Status = "down"
		hb.ErrorMsg = err.Error()
		return hb, nil
	}

	stats := pinger.Statistics()
	if stats.PacketsRecv > 0 {
		hb.Status = "up"
		hb.PingMS = int(stats.AvgRtt.Milliseconds())
	} else {
		hb.Status = "down"
		hb.ErrorMsg = "all packets lost"
	}
	return hb, nil
}
