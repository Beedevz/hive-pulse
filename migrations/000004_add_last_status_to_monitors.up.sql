ALTER TABLE monitors ADD COLUMN last_status VARCHAR(10) NOT NULL DEFAULT 'unknown'
  CHECK (last_status IN ('up', 'down', 'unknown'));
