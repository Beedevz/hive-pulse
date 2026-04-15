// Copyright (C) 2024 Beedevz. Licensed under AGPL v3 — see LICENSE for details.
package infrastructure_test

import (
	"testing"
	"time"

	"github.com/beedevz/hivepulse/internal/infrastructure"
	"github.com/stretchr/testify/assert"
)

func TestHub_BroadcastReachesClient(t *testing.T) {
	hub := infrastructure.NewHub()
	go hub.Run()

	received := make(chan []byte, 1)
	hub.RegisterTestClient(received)

	time.Sleep(10 * time.Millisecond) // let register settle

	msg := []byte(`{"type":"heartbeat"}`)
	hub.Broadcast(msg)

	select {
	case got := <-received:
		assert.Equal(t, msg, got)
	case <-time.After(500 * time.Millisecond):
		t.Fatal("timeout waiting for broadcast")
	}
}
