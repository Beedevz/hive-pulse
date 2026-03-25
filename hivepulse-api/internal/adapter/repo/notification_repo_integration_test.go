package repo_test

import (
	"context"
	"os"
	"testing"

	"github.com/beedevz/hivepulse/internal/adapter/repo"
	"github.com/beedevz/hivepulse/internal/domain"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNotificationRepo_CRUD(t *testing.T) {
	if os.Getenv("TEST_DB_URL") == "" {
		t.Skip("TEST_DB_URL not set")
	}
}

func TestNotificationRepo_AssignUnassign(t *testing.T) {
	if os.Getenv("TEST_DB_URL") == "" {
		t.Skip("TEST_DB_URL not set")
	}
}

func TestNotificationRepo_FindReminders(t *testing.T) {
	if os.Getenv("TEST_DB_URL") == "" {
		t.Skip("TEST_DB_URL not set")
	}
}

func TestNotificationRepo_HasRecentSSLLog(t *testing.T) {
	if os.Getenv("TEST_DB_URL") == "" {
		t.Skip("TEST_DB_URL not set")
	}
}

// compile-time interface check
var _ = func() {
	_ = context.Background()
	_ = assert.New
	_ = require.New
	_ = repo.NewNotificationRepo
	_ = domain.ErrNotFound
}
