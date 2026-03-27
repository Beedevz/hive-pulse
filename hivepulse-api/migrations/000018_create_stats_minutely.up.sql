CREATE TABLE stats_minutely (
    monitor_id  UUID        NOT NULL REFERENCES monitors(id) ON DELETE CASCADE,
    minute      TIMESTAMPTZ NOT NULL,
    up_count    INT         NOT NULL DEFAULT 0,
    total_count INT         NOT NULL DEFAULT 0,
    avg_ping_ms INT         NOT NULL DEFAULT 0,
    PRIMARY KEY (monitor_id, minute)
);

CREATE INDEX idx_stats_minutely_monitor_minute ON stats_minutely (monitor_id, minute DESC);
