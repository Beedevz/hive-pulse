.PHONY: run build test lint swagger migrate-up migrate-down

run:
	go run ./cmd/server/...

build:
	go build -o bin/server ./cmd/server/...

test:
	go test -v -race -coverprofile=coverage.out ./...

lint:
	golangci-lint run ./...

swagger:
	swag init --generalInfo cmd/server/main.go --output docs/

migrate-up:
	migrate -path migrations -database "$(DATABASE_URL)" up

migrate-down:
	migrate -path migrations -database "$(DATABASE_URL)" down
