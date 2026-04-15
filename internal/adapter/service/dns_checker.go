// Copyright (C) 2024 Beedevz. Licensed under AGPL v3 — see LICENSE for details.
package service

import (
	"context"
	"fmt"
	"net"
	"time"

	"github.com/beedevz/hivepulse/internal/domain"
)

type DNSChecker struct{}

func NewDNSChecker() *DNSChecker { return &DNSChecker{} }

func (c *DNSChecker) Check(ctx context.Context, m *domain.Monitor) (*domain.Heartbeat, error) {
	hb := &domain.Heartbeat{
		MonitorID: m.ID,
		CheckedAt: time.Now(),
	}

	resolver := net.DefaultResolver
	if m.DNSServer != "" {
		resolver = &net.Resolver{
			PreferGo: true,
			Dial: func(ctx context.Context, network, address string) (net.Conn, error) {
				d := net.Dialer{Timeout: time.Duration(m.Timeout) * time.Second}
				return d.DialContext(ctx, "udp", m.DNSServer+":53")
			},
		}
	}

	start := time.Now()
	var err error
	switch m.RecordType {
	case "A", "AAAA":
		_, err = resolver.LookupHost(ctx, m.DNSHost)
	case "CNAME":
		_, err = resolver.LookupCNAME(ctx, m.DNSHost)
	case "MX":
		_, err = resolver.LookupMX(ctx, m.DNSHost)
	case "TXT":
		_, err = resolver.LookupTXT(ctx, m.DNSHost)
	default:
		err = fmt.Errorf("unsupported record type: %s", m.RecordType)
	}
	hb.PingMS = int(time.Since(start).Milliseconds())

	if err != nil {
		hb.Status = "down"
		hb.ErrorMsg = err.Error()
		return hb, nil
	}
	hb.Status = "up"
	return hb, nil
}
