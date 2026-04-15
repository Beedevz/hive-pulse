CREATE TABLE incidents (
  id           BIGSERIAL PRIMARY KEY,
  monitor_id   UUID NOT NULL REFERENCES monitors(id) ON DELETE CASCADE,
  monitor_name TEXT NOT NULL,
  started_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at  TIMESTAMPTZ NULL,
  error_msg    TEXT
);

CREATE INDEX idx_incidents_monitor_id  ON incidents(monitor_id);
CREATE INDEX idx_incidents_resolved_at ON incidents(resolved_at);
CREATE INDEX idx_incidents_started_at  ON incidents(started_at DESC);

CREATE UNIQUE INDEX idx_incidents_one_open_per_monitor
  ON incidents(monitor_id) WHERE resolved_at IS NULL;
