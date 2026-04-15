// Copyright (C) 2024 Beedevz. Licensed under AGPL v3 — see LICENSE for details.
package infrastructure

import (
	"context"
	"fmt"
	"sync"

	"github.com/beedevz/hivepulse/internal/domain"
	"github.com/beedevz/hivepulse/internal/port"
	"github.com/robfig/cron/v3"
)

type Scheduler struct {
	cron   *cron.Cron
	jobs   map[string]cron.EntryID
	runner port.CheckRunner
	mu     sync.Mutex
}

func NewScheduler(runner port.CheckRunner) *Scheduler {
	return &Scheduler{
		cron:   cron.New(cron.WithSeconds()),
		jobs:   make(map[string]cron.EntryID),
		runner: runner,
	}
}

func (s *Scheduler) Start() { s.cron.Start() }
func (s *Scheduler) Stop()  { s.cron.Stop() }

func (s *Scheduler) Add(m *domain.Monitor) {
	if !m.Enabled {
		return
	}
	spec := fmt.Sprintf("@every %ds", m.Interval)
	id, err := s.cron.AddFunc(spec, func() {
		s.runner.RunCheck(context.Background(), m.ID)
	})
	if err != nil {
		return
	}
	s.mu.Lock()
	s.jobs[m.ID] = id
	s.mu.Unlock()
}

func (s *Scheduler) Remove(monitorID string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if id, ok := s.jobs[monitorID]; ok {
		s.cron.Remove(id)
		delete(s.jobs, monitorID)
	}
}

func (s *Scheduler) Update(m *domain.Monitor) {
	s.Remove(m.ID)
	if m.Enabled {
		s.Add(m)
	}
}
