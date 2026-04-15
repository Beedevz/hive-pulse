// Copyright (C) 2024 Beedevz. Licensed under AGPL v3 — see LICENSE for details.
package usecase_test

import (
	"testing"
	"time"

	"github.com/beedevz/hivepulse/internal/domain"
	"github.com/beedevz/hivepulse/internal/usecase"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func makeTime(day time.Weekday, hour, min int) time.Time {
	// 2026-03-02 is a Monday
	base := time.Date(2026, 3, 2, 0, 0, 0, 0, time.UTC)
	offset := int(day) - int(time.Monday)
	return base.AddDate(0, 0, offset).Add(time.Duration(hour)*time.Hour + time.Duration(min)*time.Minute)
}

func TestIsWithinSchedule_InWindow(t *testing.T) {
	s := &domain.ScheduleRule{Days: []string{"mon"}, Start: "09:00", End: "18:00"}
	now := makeTime(time.Monday, 14, 0)
	ok, err := usecase.IsWithinSchedule(now, s)
	require.NoError(t, err)
	assert.True(t, ok)
}

func TestIsWithinSchedule_WrongDay(t *testing.T) {
	s := &domain.ScheduleRule{Days: []string{"mon", "tue"}, Start: "09:00", End: "18:00"}
	now := makeTime(time.Saturday, 14, 0)
	ok, err := usecase.IsWithinSchedule(now, s)
	require.NoError(t, err)
	assert.False(t, ok)
}

func TestIsWithinSchedule_OutOfWindowTime(t *testing.T) {
	s := &domain.ScheduleRule{Days: []string{"mon"}, Start: "09:00", End: "18:00"}
	now := makeTime(time.Monday, 8, 59)
	ok, err := usecase.IsWithinSchedule(now, s)
	require.NoError(t, err)
	assert.False(t, ok)
}

func TestIsWithinSchedule_BoundaryAtStart(t *testing.T) {
	s := &domain.ScheduleRule{Days: []string{"mon"}, Start: "09:00", End: "18:00"}
	now := makeTime(time.Monday, 9, 0)
	ok, err := usecase.IsWithinSchedule(now, s)
	require.NoError(t, err)
	assert.True(t, ok)
}

func TestIsWithinSchedule_BoundaryAtEnd(t *testing.T) {
	s := &domain.ScheduleRule{Days: []string{"mon"}, Start: "09:00", End: "18:00"}
	now := makeTime(time.Monday, 18, 0)
	ok, err := usecase.IsWithinSchedule(now, s)
	require.NoError(t, err)
	assert.False(t, ok) // end is exclusive
}

func TestIsWithinSchedule_MalformedStart(t *testing.T) {
	s := &domain.ScheduleRule{Days: []string{"mon"}, Start: "notatime", End: "18:00"}
	_, err := usecase.IsWithinSchedule(makeTime(time.Monday, 14, 0), s)
	assert.Error(t, err)
}

func TestIsWithinSchedule_MalformedEnd(t *testing.T) {
	s := &domain.ScheduleRule{Days: []string{"mon"}, Start: "09:00", End: "notatime"}
	_, err := usecase.IsWithinSchedule(makeTime(time.Monday, 14, 0), s)
	assert.Error(t, err)
}
