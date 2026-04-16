.PHONY: dev-setup build-oss build-saas build-ui test test-go test-ui dev-ui dev-go clean

# ── Local dev setup: symlink SaaS repos into inject directories ──────────────
dev-setup:
	@test -d ../hivepulse-saas-providers || \
		(echo "ERROR: ../hivepulse-saas-providers not found — clone it next to this repo" && exit 1)
	@test -d ../hivepulse-saas-ui || \
		(echo "ERROR: ../hivepulse-saas-ui not found — clone it next to this repo" && exit 1)
	@mkdir -p internal/providers ui/src
	ln -sfn $(abspath ../hivepulse-saas-providers) internal/providers/saas
	ln -sfn $(abspath ../hivepulse-saas-ui) ui/src/saas
	@echo "Dev symlinks created:"
	@echo "  internal/providers/saas → $(abspath ../hivepulse-saas-providers)"
	@echo "  ui/src/saas             → $(abspath ../hivepulse-saas-ui)"

# ── Build ────────────────────────────────────────────────────────────────────
build-ui:
	cd ui && npm ci && npm run build
	mkdir -p web/dist
	cp -r ui/dist/. web/dist/

build-oss: build-ui
	CGO_ENABLED=0 go build -ldflags="-s -w" -o bin/hivepulse-oss ./cmd/oss/...

build-saas: build-ui
	CGO_ENABLED=0 go build -ldflags="-s -w" -o bin/hivepulse-saas ./cmd/saas/...

# ── Tests ────────────────────────────────────────────────────────────────────
test-go:
	go test ./...

test-ui:
	cd ui && npm test

test: test-go test-ui

# ── Dev servers (run separately in two terminals) ────────────────────────────
dev-ui:
	cd ui && npm run dev

dev-go:
	mkdir -p web/dist && touch web/dist/.keep
	go run ./cmd/oss/...

# ── Clean ────────────────────────────────────────────────────────────────────
clean:
	rm -rf web/dist bin/
