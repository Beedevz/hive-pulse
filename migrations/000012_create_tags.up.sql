CREATE TABLE tags (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name       TEXT NOT NULL UNIQUE,
    color      TEXT NOT NULL DEFAULT '#6BA3F7',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE monitor_tags (
    monitor_id UUID NOT NULL REFERENCES monitors(id) ON DELETE CASCADE,
    tag_id     UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (monitor_id, tag_id)
);

CREATE INDEX idx_monitor_tags_monitor_id ON monitor_tags(monitor_id);
CREATE INDEX idx_monitor_tags_tag_id ON monitor_tags(tag_id);
