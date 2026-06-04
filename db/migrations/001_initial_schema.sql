-- Users: one row per friend
CREATE TABLE users (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email      TEXT NOT NULL UNIQUE,
    name       TEXT NOT NULL,
    balance    NUMERIC(10, 2) NOT NULL DEFAULT 500.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Markets: one row per question ("Will Man City finish top 4?")
CREATE TABLE markets (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question    TEXT NOT NULL,
    description TEXT,
    status      TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'settled')),
    result      TEXT CHECK (result IN ('yes', 'no')),
    yes_price   NUMERIC(5, 2) NOT NULL DEFAULT 0.50, -- probability 0.00-1.00
    created_by  UUID NOT NULL REFERENCES users(id),
    closes_at   TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Bets: one row per bet placed
CREATE TABLE bets (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id),
    market_id   UUID NOT NULL REFERENCES markets(id),
    side        TEXT NOT NULL CHECK (side IN ('yes', 'no')),
    amount      NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    yes_price   NUMERIC(5, 2) NOT NULL, -- odds locked in at time of bet
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Transactions: audit log of every balance change
CREATE TABLE transactions (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES users(id),
    amount       NUMERIC(10, 2) NOT NULL, -- positive = credit, negative = debit
    type         TEXT NOT NULL CHECK (type IN ('bet_placed', 'payout', 'deposit')),
    reference_id UUID, -- points to the bet or market that caused this
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX ON bets (market_id);
CREATE INDEX ON bets (user_id);
CREATE INDEX ON transactions (user_id);
