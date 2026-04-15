# HivePulse

Open-source uptime monitoring and status page platform. Self-hosted, lightweight, and built for teams running 5–500 endpoints on a single node.

![License](https://img.shields.io/badge/license-AGPL--v3-blue)
![Docker](https://img.shields.io/badge/docker-beedevztech%2Fhivepulse-blue)

---

## Features

- **HTTP / HTTPS, TCP, PING, DNS** monitoring
- **Real-time dashboard** with WebSocket live updates
- **Uptime heatmap** and response time charts (24h / 7d / 90d)
- **Incident tracking** with duration and error details
- **Email, Slack, Webhook** notification channels with per-monitor trigger rules
- **Public status pages** with custom slugs
- **Tag-based filtering** for large monitor fleets
- **RBAC** — Admin, Editor, Viewer roles
- **Dark / Void / Light** themes

## Quick Start

```bash
# 1. Clone
git clone https://github.com/Beedevz/hivepulse.git
cd hivepulse

# 2. Configure
cp .env.example .env
# Edit .env — set POSTGRES_PASSWORD, HIVEPULSE_JWT_SECRET, etc.

# 3. Run
docker compose up -d
```

Open **http://localhost:8091** and complete the setup wizard.

## Configuration

| Variable | Description | Default |
|---|---|---|
| `POSTGRES_PASSWORD` | PostgreSQL password | *(required)* |
| `HIVEPULSE_JWT_SECRET` | Access token signing key (min 32 chars) | *(required)* |
| `HIVEPULSE_JWT_REFRESH_SECRET` | Refresh token signing key | *(required)* |
| `HIVEPULSE_ENCRYPTION_KEY` | AES-256 key for notification secrets | *(required)* |
| `HIVEPULSE_PORT` | API listen port | `8080` |
| `HIVEPULSE_LOG_LEVEL` | `debug` / `info` / `warn` / `error` | `info` |
| `HIVEPULSE_CORS_ORIGINS` | Allowed origins (comma-separated) | `*` |

## Docker Hub

```bash
docker pull beedevztech/hivepulse:latest
```

## Kubernetes (Helm)

```bash
helm repo add hivepulse https://beedevz.github.io/hivepulse
helm repo update
helm upgrade --install hivepulse hivepulse/hivepulse \
  --set env.jwtSecret=<secret> \
  --set env.jwtRefreshSecret=<secret> \
  --set env.encryptionKey=<32-byte-key>
```

## Development

```bash
# Backend
go test ./internal/... ./infrastructure/...
go build ./cmd/oss

# Frontend
cd ui && npm ci && npm run dev

# Full stack
docker compose up
```

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Go 1.22 · Gin · GORM · PostgreSQL 16 |
| Frontend | React 18 · TypeScript · Vite · MUI |
| State | Zustand · TanStack React Query |
| Realtime | WebSocket (gorilla/websocket) |
| Auth | JWT (15 min access · 7 day refresh) |
| Scheduler | robfig/cron v3 |

## License

[AGPL v3](LICENSE) © [Beedevz](https://github.com/Beedevz)

For commercial embedded use or proprietary deployments, contact **hello@beedevz.com**.
