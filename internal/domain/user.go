// Copyright (C) 2024 Beedevz. Licensed under AGPL v3 — see LICENSE for details.
package domain

import (
	"time"
)

type Role string

const (
	RoleAdmin  Role = "admin"
	RoleEditor Role = "editor"
	RoleViewer Role = "viewer"
)

type User struct {
	ID           string
	Email        string
	Name         string
	PasswordHash string
	Role         Role
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

type RefreshToken struct {
	ID        string
	UserID    string
	TokenHash string
	DeviceFP  string
	IP        string
	ExpiresAt time.Time
	CreatedAt time.Time
}
