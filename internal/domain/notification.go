package domain

import "time"

type ChannelType string

const (
	ChannelEmail   ChannelType = "email"
	ChannelWebhook ChannelType = "webhook"
	ChannelSlack   ChannelType = "slack"
)

type NotificationChannel struct {
	ID                string
	Name              string
	Type              ChannelType
	Config            map[string]string
	IsGlobal          bool
	Enabled           bool
	RemindIntervalMin int
	CreatedAt         time.Time
	UpdatedAt         time.Time
}

type NotificationEvent string

const (
	EventDown      NotificationEvent = "down"
	EventUp        NotificationEvent = "up"
	EventSSLExpiry NotificationEvent = "ssl_expiry"
)

type NotificationLog struct {
	ID          int64
	ChannelID   string
	MonitorName string // resolved via JOIN; empty string if monitor was deleted
	MonitorID   string
	Event       NotificationEvent
	Status      string // "sent" | "failed"
	ErrorMsg    string
	SentAt      time.Time
}

// ReminderTarget is a (monitor, channel) pair eligible for re-notification.
type ReminderTarget struct {
	MonitorID string
	ChannelID string
}

// ScheduleRule defines the days and time window for sending notifications.
type ScheduleRule struct {
	Days  []string `json:"days"`  // e.g. ["mon","tue","wed","thu","fri"]
	Start string   `json:"start"` // "HH:MM" 24-hour
	End   string   `json:"end"`   // "HH:MM" 24-hour
}

// AssignmentTriggers controls when a notification is sent for a specific
// monitor-channel assignment.
type AssignmentTriggers struct {
	CooldownMinutes int           `json:"cooldown_minutes"` // 0 = disabled
	Schedule        *ScheduleRule `json:"schedule,omitempty"`
}

// MonitorChannelAssignment pairs a channel with its per-assignment triggers.
type MonitorChannelAssignment struct {
	Channel  *NotificationChannel
	Triggers AssignmentTriggers
}
