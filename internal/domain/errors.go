// Copyright (C) 2024 Beedevz. Licensed under AGPL v3 — see LICENSE for details.
package domain

import "errors"

var (
	ErrNotFound       = errors.New("not found")
	ErrAlreadyExists  = errors.New("already exists")
	ErrUnauthorized   = errors.New("unauthorized")
	ErrSetupCompleted = errors.New("setup already completed")
	ErrInvalidInput   = errors.New("invalid input")
	ErrValidation     = errors.New("validation error")
)
