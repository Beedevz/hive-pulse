CREATE TABLE heartbeats (
    id          BIGSERIAL PRIMARY KEY,
    monitor_id  UUID NOT NULL REFERENCES monitors(id) ON DELETE CASCADE,
    status      VARCHAR(10) NOT NULL CHECK (status IN ('up', 'down')),
    ping_ms     INTEGER NOT NULL DEFAULT 0,
    status_code SMALLINT,
    error_msg   TEXT,
    checked_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_heartbeats_monitor_time ON heartbeats(monitor_id, checked_at DESC);
