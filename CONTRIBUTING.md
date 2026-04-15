# Contributing to HivePulse

Thank you for your interest in contributing to HivePulse!

## Contributor License Agreement (CLA)

Before your pull request can be merged, you must sign the **Contributor License Agreement**.

The CLA bot will automatically post a comment on your pull request with a link to sign. Signing takes less than a minute.

**Why a CLA?** HivePulse is licensed under AGPL v3. The CLA allows Beedevz to offer commercial licenses to organizations that cannot adopt AGPL. Without it, we cannot legally distribute proprietary builds.

## How to Contribute

1. Fork the repository and create a feature branch (`feat/your-feature`)
2. Make your changes — follow the existing code style
3. Run tests: `make test`
4. Open a pull request against `main`
5. Sign the CLA when prompted by the bot

## Code Style

- **Go**: `gofmt`, `golangci-lint` — run `golangci-lint run` before committing
- **TypeScript/React**: ESLint + Prettier — run `npm run lint` before committing
- Every new HTTP handler needs Swagger annotations; run `swag init` after changes

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):
`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`, `test:`

## Commercial Use

For commercial embedded use or to obtain a proprietary license, contact **hello@beedevz.com**.
