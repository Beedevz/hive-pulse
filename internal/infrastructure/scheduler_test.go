// Copyright (C) 2024 Beedevz. Licensed under AGPL v3 — see LICENSE for details.
package infrastructure_test

import (
	"context"
	"testing"
	"time"

	"github.com/beedevz/hivepulse/internal/domain"
	"github.com/beedevz/hivepulse/internal/infrastructure"
	"github.com/stretchr/testify/assert"
)

type mockRunner struct {
	calls chan string
}

func (m *mockRunner) RunCheck(_ context.Context, monitorID string) {
	m.calls <- monitorID
}

func TestScheduler_AddAndFire(t *testing.T) {
	runner := &mockRunner{calls: make(chan string, 10)}
	s := infrastructure.NewScheduler(runner)
	s.Start()
	defer s.Stop()

	m := &domain.Monitor{ID: "m1", Interval: 1, Enabled: true}
	s.Add(m)

	select {
	case id := <-runner.calls:
		assert.Equal(t, "m1", id)
	case <-time.After(3 * time.Second):
		t.Fatal("scheduler did not fire within 3s")
	}
}

func TestScheduler_RemoveStopsFiring(t *testing.T) {
	runner := &mockRunner{calls: make(chan string, 10)}
	s := infrastructure.NewScheduler(runner)
	s.Start()
	defer s.Stop()

	m := &domain.Monitor{ID: "m2", Interval: 1, Enabled: true}
	s.Add(m)
	time.Sleep(150 * time.Millisecond)
	s.Remove("m2")

	// drain any already-queued calls
	for len(runner.calls) > 0 {
		<-runner.calls
	}
	time.Sleep(1500 * time.Millisecond)
	assert.Equal(t, 0, len(runner.calls), "job should not fire after Remove")
}
