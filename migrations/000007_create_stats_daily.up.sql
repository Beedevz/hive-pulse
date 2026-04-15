CREATE TABLE stats_daily (
    monitor_id  UUID NOT NULL REFERENCES monitors(id) ON DELETE CASCADE,
    day         DATE NOT NULL,
    up_count    INT  NOT NULL DEFAULT 0,
    total_count INT  NOT NULL DEFAULT 0,
    avg_ping_ms INT  NOT NULL DEFAULT 0,
    PRIMARY KEY (monitor_id, day)
);
