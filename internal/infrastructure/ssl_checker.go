// Copyright (C) 2024 Beedevz. Licensed under AGPL v3 — see LICENSE for details.
package infrastructure

import (
	"context"
	"crypto/tls"
	"log"
	"net"
	"net/url"
	"strings"
	"time"

	"github.com/beedevz/hivepulse/internal/domain"
	"github.com/beedevz/hivepulse/internal/port"
)

type SSLChecker struct {
	monitors  port.MonitorRepository
	notifier  port.Notifier
	notifRepo port.NotificationRepository
}

func NewSSLChecker(monitors port.MonitorRepository, notifier port.Notifier, notifRepo port.NotificationRepository) *SSLChecker {
	return &SSLChecker{monitors: monitors, notifier: notifier, notifRepo: notifRepo}
}

func (s *SSLChecker) Start(ctx context.Context) {
	ticker := time.NewTicker(6 * time.Hour)
	defer ticker.Stop()
	if err := s.Tick(ctx); err != nil {
		log.Printf("ssl_checker tick error: %v", err)
	}
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			if err := s.Tick(ctx); err != nil {
				log.Printf("ssl_checker tick error: %v", err)
			}
		}
	}
}

func (s *SSLChecker) Tick(ctx context.Context) error {
	monitors, _, err := s.monitors.FindAll(ctx, 1, 1000)
	if err != nil {
		return err
	}
	for _, m := range monitors {
		if !m.Enabled || !strings.HasPrefix(m.URL, "https://") {
			continue
		}
		days, err := s.certDaysRemaining(m.URL)
		if err != nil {
			log.Printf("ssl_checker: cert check failed for %s: %v", m.URL, err)
			continue
		}
		if days >= 30 {
			continue
		}
		recent, err := s.notifRepo.HasRecentSSLLog(ctx, m.ID, 24*time.Hour)
		if err != nil || recent {
			continue
		}
		s.notifier.Notify(ctx, m.ID, domain.EventSSLExpiry)
	}
	return nil
}

func (s *SSLChecker) certDaysRemaining(rawURL string) (int, error) {
	u, err := url.Parse(rawURL)
	if err != nil {
		return 0, err
	}
	host := u.Hostname()
	port := u.Port()
	if port == "" {
		port = "443"
	}
	conn, err := tls.Dial("tcp", net.JoinHostPort(host, port), &tls.Config{ServerName: host, MinVersion: tls.VersionTLS12})
	if err != nil {
		return 0, err
	}
	defer conn.Close()
	expiry := conn.ConnectionState().PeerCertificates[0].NotAfter
	days := int(time.Until(expiry).Hours() / 24)
	return days, nil
}
