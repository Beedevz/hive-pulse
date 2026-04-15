package domain

import "time"

type Tag struct {
	ID        string
	Name      string
	Color     string
	CreatedAt time.Time
}
