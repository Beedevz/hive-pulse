.PHONY: dev-setup build-oss build-saas build-ui test test-go test-ui dev-ui dev-go clean

# ── Local dev setup: symlink SaaS repos into inject directories ──────────────
dev-setup:
	@echo "Setting up SaaS symlinks..."
	@mkdir -p internal/providers cmd/saas ui/src
	@if [ -d "../hivepulse-saas-providers" ]; then \
		ln -sfn "$$(realpath ../hivepulse-saas-providers)" internal/providers/saas; \
		echo "  ✓ internal/providers/saas → ../hivepulse-saas-providers"; \
	else \
		echo "  ✗ ../hivepulse-saas-providers not found — clone it next to this repo"; \
	fi
	@if [ -d "../hivepulse-saas-ui" ]; then \
		ln -sfn "$$(realpath ../hivepulse-saas-ui)" ui/src/saas; \
		echo "  ✓ ui/src/saas → ../hivepulse-saas-ui"; \
	else \
		echo "  ✗ ../hivepulse-saas-ui not found — clone it next to this repo"; \
	fi

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
