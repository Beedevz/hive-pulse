// Copyright (C) 2024 Beedevz. Licensed under AGPL v3 — see LICENSE for details.
package domain

import "time"

type CheckType string

const (
	CheckHTTP CheckType = "http"
	CheckTCP  CheckType = "tcp"
	CheckPING CheckType = "ping"
	CheckDNS  CheckType = "dns"
)

type Monitor struct {
	ID            string
	UserID        string
	Name          string
	CheckType     CheckType
	Interval      int
	Timeout       int
	Retries       int
	RetryInterval int
	Enabled       bool
	// HTTP
	URL             string
	Method          string
	ExpectedStatus  int
	RequestHeaders  string
	RequestBody     string
	FollowRedirects bool
	SkipTLSVerify   bool
	ExpectedKeyword string
	// TCP
	Host string
	Port int
	// PING
	PingHost    string
	PacketCount int
	// DNS
	DNSHost       string
	RecordType    string
	ExpectedValue string
	DNSServer     string

	CreatedAt time.Time
	UpdatedAt time.Time
	LastStatus string // "up" | "down" | "unknown"
}
