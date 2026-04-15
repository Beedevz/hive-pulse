CREATE TABLE status_pages (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug          TEXT NOT NULL UNIQUE,
    title         TEXT NOT NULL,
    description   TEXT,
    logo_url      TEXT,
    accent_color  TEXT NOT NULL DEFAULT '#F5A623',
    custom_domain TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE status_page_tags (
    status_page_id UUID NOT NULL REFERENCES status_pages(id) ON DELETE CASCADE,
    tag_id         UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (status_page_id, tag_id)
);

CREATE INDEX idx_status_page_tags_page_id ON status_page_tags(status_page_id);
CREATE INDEX idx_status_page_tags_tag_id ON status_page_tags(tag_id);
