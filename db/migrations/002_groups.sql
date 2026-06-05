-- Groups: a private betting circle
CREATE TABLE IF NOT EXISTS groups (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    invite_code TEXT NOT NULL UNIQUE,
    created_by  UUID NOT NULL REFERENCES users(id),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Group membership with per-group balance
CREATE TABLE IF NOT EXISTS group_members (
    group_id   UUID NOT NULL REFERENCES groups(id),
    user_id    UUID NOT NULL REFERENCES users(id),
    balance    NUMERIC(10, 2) NOT NULL DEFAULT 500.00,
    joined_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (group_id, user_id)
);

-- Markets now belong to a group
ALTER TABLE markets ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES groups(id);

CREATE INDEX IF NOT EXISTS markets_group_id_idx ON markets (group_id);
CREATE INDEX IF NOT EXISTS group_members_user_id_idx ON group_members (user_id);
