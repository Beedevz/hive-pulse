ALTER TABLE monitor_notification_channels
  ADD COLUMN triggers JSONB NOT NULL DEFAULT '{}';
