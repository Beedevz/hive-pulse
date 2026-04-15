// Copyright (C) 2024 Beedevz. Licensed under AGPL v3 — see LICENSE for details.
package service_test

import (
	"context"
	"testing"

	"github.com/beedevz/hivepulse/internal/adapter/service"
	"github.com/beedevz/hivepulse/internal/domain"
	"github.com/stretchr/testify/assert"
)

func TestDNSChecker_Up(t *testing.T) {
	checker := service.NewDNSChecker()
	m := &domain.Monitor{
		CheckType:  domain.CheckDNS,
		DNSHost:    "google.com",
		RecordType: "A",
		Timeout:    5,
	}
	hb, err := checker.Check(context.Background(), m)
	assert.NoError(t, err)
	assert.Equal(t, "up", hb.Status)
	assert.Greater(t, hb.PingMS, -1)
	assert.False(t, hb.CheckedAt.IsZero())
}

func TestDNSChecker_Down_InvalidHost(t *testing.T) {
	checker := service.NewDNSChecker()
	m := &domain.Monitor{
		CheckType:  domain.CheckDNS,
		DNSHost:    "this-does-not-exist-hivepulse-test.invalid",
		RecordType: "A",
		Timeout:    3,
	}
	hb, err := checker.Check(context.Background(), m)
	assert.NoError(t, err)
	assert.Equal(t, "down", hb.Status)
	assert.NotEmpty(t, hb.ErrorMsg)
}
