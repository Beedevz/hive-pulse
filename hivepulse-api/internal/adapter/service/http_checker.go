package service

import (
	"context"
	"crypto/tls"
	"fmt"
	"net/http"
	"time"

	"github.com/beedevz/hivepulse/internal/domain"
)

type HTTPChecker struct{}

func NewHTTPChecker() *HTTPChecker { return &HTTPChecker{} }

func (c *HTTPChecker) Check(ctx context.Context, m *domain.Monitor) (*domain.Heartbeat, error) {
	hb := &domain.Heartbeat{
		MonitorID: m.ID,
		CheckedAt: time.Now(),
	}

	transport := &http.Transport{
		TLSClientConfig: &tls.Config{InsecureSkipVerify: m.SkipTLSVerify}, //nolint:gosec
	}
	client := &http.Client{
		Timeout:   time.Duration(m.Timeout) * time.Second,
		Transport: transport,
		CheckRedirect: func(req *http.Request, via []*http.Request) error {
			if !m.FollowRedirects {
				return http.ErrUseLastResponse
			}
			return nil
		},
	}

	req, err := http.NewRequestWithContext(ctx, m.Method, m.URL, nil)
	if err != nil {
		hb.Status = "down"
		hb.ErrorMsg = err.Error()
		return hb, nil
	}

	start := time.Now()
	resp, err := client.Do(req)
	elapsed := time.Since(start)
	pingMS := int(elapsed.Milliseconds())
	if pingMS < 1 {
		pingMS = 1
	}
	hb.PingMS = pingMS

	if err != nil {
		hb.Status = "down"
		hb.ErrorMsg = err.Error()
		return hb, nil
	}
	defer resp.Body.Close()

	hb.StatusCode = resp.StatusCode
	if resp.StatusCode == m.ExpectedStatus {
		hb.Status = "up"
	} else {
		hb.Status = "down"
		hb.ErrorMsg = fmt.Sprintf("expected status %d, got %d", m.ExpectedStatus, resp.StatusCode)
	}
	return hb, nil
}
