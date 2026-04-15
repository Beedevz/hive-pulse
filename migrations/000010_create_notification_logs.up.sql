CREATE TABLE notification_logs (
    id         BIGSERIAL   PRIMARY KEY,
    channel_id UUID        NOT NULL REFERENCES notification_channels(id) ON DELETE CASCADE,
    monitor_id UUID        NOT NULL,
    event      TEXT        NOT NULL CHECK (event IN ('down', 'up', 'ssl_expiry')),
    status     TEXT        NOT NULL CHECK (status IN ('sent', 'failed')),
    error_msg  TEXT,
    sent_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_notification_logs_channel_sent ON notification_logs (channel_id, sent_at DESC);
CREATE INDEX idx_notification_logs_monitor_sent ON notification_logs (monitor_id, sent_at DESC);
