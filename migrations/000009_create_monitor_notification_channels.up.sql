CREATE TABLE monitor_notification_channels (
    monitor_id UUID NOT NULL REFERENCES monitors(id) ON DELETE CASCADE,
    channel_id UUID NOT NULL REFERENCES notification_channels(id) ON DELETE CASCADE,
    PRIMARY KEY (monitor_id, channel_id)
);
