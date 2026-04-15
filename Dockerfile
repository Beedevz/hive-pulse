# ── Stage 1: Build React frontend ────────────────────────────────────────────
FROM node:20-alpine AS web-builder
WORKDIR /app
COPY ui/package*.json ./
RUN npm ci
COPY ui/ .
RUN npm run build

# ── Stage 2: Build Go binary with embedded frontend ─────────────────────────
FROM golang:1.26-alpine AS api-builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
COPY --from=web-builder /app/dist ./web/dist/
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o server ./cmd/oss/...

# ── Stage 3: Minimal runtime ────────────────────────────────────────────────
FROM alpine:3.21
RUN apk upgrade --no-cache && apk add --no-cache ca-certificates
COPY --from=api-builder /app/server /app/server
COPY --from=api-builder /app/migrations /app/migrations
WORKDIR /app
EXPOSE 8080
CMD ["./server"]
