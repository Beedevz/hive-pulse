package domain

// GeneralSettings holds application-wide configuration.
type GeneralSettings struct {
	Timezone string `json:"timezone"` // IANA timezone, e.g. "Europe/Istanbul"
}
