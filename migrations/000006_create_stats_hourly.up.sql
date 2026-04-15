CREATE TABLE stats_hourly (
    monitor_id  UUID        NOT NULL REFERENCES monitors(id) ON DELETE CASCADE,
    hour        TIMESTAMPTZ NOT NULL,
    up_count    INT         NOT NULL DEFAULT 0,
    total_count INT         NOT NULL DEFAULT 0,
    avg_ping_ms INT         NOT NULL DEFAULT 0,
    PRIMARY KEY (monitor_id, hour)
);
