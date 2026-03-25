package infrastructure

import (
	"log"
	"os"
	"strconv"
	"time"
)

type Config struct {
	AppEnv      string
	APIPort     string
	DatabaseURL string

	JWTAccessSecret  string
	JWTRefreshSecret string
	JWTAccessExpiry  time.Duration
	JWTRefreshExpiry time.Duration

	CORSAllowedOrigins string

	SMTPHost     string
	SMTPPort     int
	SMTPUser     string
	SMTPPassword string
	SMTPFrom     string
}

func LoadConfig() *Config {
	accessExpiry, err := time.ParseDuration(getEnv("JWT_ACCESS_EXPIRY", "15m"))
	if err != nil {
		log.Fatalf("invalid JWT_ACCESS_EXPIRY: %v", err)
	}
	refreshExpiry, err := time.ParseDuration(getEnv("JWT_REFRESH_EXPIRY", "168h"))
	if err != nil {
		log.Fatalf("invalid JWT_REFRESH_EXPIRY: %v", err)
	}

	return &Config{
		AppEnv:             getEnv("APP_ENV", "development"),
		APIPort:            getEnv("API_PORT", "8080"),
		DatabaseURL:        mustEnv("DATABASE_URL"),
		JWTAccessSecret:    mustEnv("JWT_ACCESS_SECRET"),
		JWTRefreshSecret:   mustEnv("JWT_REFRESH_SECRET"),
		JWTAccessExpiry:    accessExpiry,
		JWTRefreshExpiry:   refreshExpiry,
		CORSAllowedOrigins: getEnv("CORS_ALLOWED_ORIGINS", "http://localhost:5173"),
		SMTPHost:           getEnv("SMTP_HOST", ""),
		SMTPPort: func() int {
			p := getEnv("SMTP_PORT", "587")
			port, _ := strconv.Atoi(p)
			if port == 0 {
				port = 587
			}
			return port
		}(),
		SMTPUser:     getEnv("SMTP_USER", ""),
		SMTPPassword: getEnv("SMTP_PASSWORD", ""),
		SMTPFrom:     getEnv("SMTP_FROM", ""),
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func mustEnv(key string) string {
	v := os.Getenv(key)
	if v == "" {
		log.Fatalf("required environment variable not set: %s", key)
	}
	return v
}
