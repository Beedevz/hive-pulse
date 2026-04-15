CREATE TABLE maintenance_windows (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    monitor_id UUID REFERENCES monitors(id) ON DELETE CASCADE,
    starts_at  TIMESTAMPTZ NOT NULL,
    ends_at    TIMESTAMPTZ NOT NULL,
    reason     TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (ends_at > starts_at)
);

CREATE INDEX idx_mw_monitor_active ON maintenance_windows (monitor_id, starts_at, ends_at);
