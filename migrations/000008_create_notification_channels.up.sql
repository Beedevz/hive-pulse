CREATE TABLE notification_channels (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name                TEXT        NOT NULL,
    type                TEXT        NOT NULL CHECK (type IN ('email', 'webhook', 'slack')),
    config              JSONB       NOT NULL DEFAULT '{}',
    is_global           BOOLEAN     NOT NULL DEFAULT false,
    enabled             BOOLEAN     NOT NULL DEFAULT true,
    remind_interval_min INT         NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
