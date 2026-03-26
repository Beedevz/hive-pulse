# ── Stage 1: Build Go API ────────────────────────────────────────────────────
FROM golang:1.26-alpine AS api-builder
WORKDIR /app
COPY hivepulse-api/go.mod hivepulse-api/go.sum ./
RUN go mod download
COPY hivepulse-api/ .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o server ./cmd/server/...

# ── Stage 2: Build React frontend ────────────────────────────────────────────
FROM node:20-alpine AS web-builder
WORKDIR /app
COPY hivepulse-web/package*.json ./
RUN npm ci
COPY hivepulse-web/ .
RUN npm run build

# ── Stage 3: Final image (nginx + Go binary) ─────────────────────────────────
FROM nginx:alpine

# Install ca-certificates for HTTPS checks in the Go server
RUN apk add --no-cache ca-certificates

# Go API binary + migrations
COPY --from=api-builder /app/server /app/server
COPY --from=api-builder /app/migrations /app/migrations

# React static files
COPY --from=web-builder /app/dist /usr/share/nginx/html

# nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Entrypoint: start Go server then hand off to nginx
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/entrypoint.sh"]
