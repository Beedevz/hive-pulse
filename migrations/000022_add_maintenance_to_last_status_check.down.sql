ALTER TABLE monitors DROP CONSTRAINT monitors_last_status_check;
ALTER TABLE monitors ADD CONSTRAINT monitors_last_status_check
    CHECK (last_status IN ('up', 'down', 'unknown'));
