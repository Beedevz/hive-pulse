CREATE TABLE app_settings (
    key   TEXT    PRIMARY KEY,
    value JSONB   NOT NULL DEFAULT '{}'
);
