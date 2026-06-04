-- Sample data for local development
-- Run after 001_initial_schema.sql

INSERT INTO users (id, email, name, balance) VALUES
    ('00000000-0000-0000-0000-000000000001', 'alice@example.com', 'Alice', 500.00),
    ('00000000-0000-0000-0000-000000000002', 'bob@example.com',   'Bob',   500.00),
    ('00000000-0000-0000-0000-000000000003', 'charlie@example.com', 'Charlie', 500.00);

INSERT INTO markets (id, question, description, yes_price, created_by, closes_at) VALUES
    (
        '10000000-0000-0000-0000-000000000001',
        'Will Man City finish top 4 this season?',
        'Premier League 2025/26 season final standings.',
        0.54,
        '00000000-0000-0000-0000-000000000001',
        '2026-05-20 00:00:00+00'
    ),
    (
        '10000000-0000-0000-0000-000000000002',
        'Will GPT-5 be released before end of 2025?',
        NULL,
        0.81,
        '00000000-0000-0000-0000-000000000002',
        '2025-12-31 00:00:00+00'
    );

INSERT INTO bets (user_id, market_id, side, amount, yes_price) VALUES
    ('00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'yes', 50.00, 0.54),
    ('00000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'no',  30.00, 0.46);

INSERT INTO transactions (user_id, amount, type, reference_id) VALUES
    ('00000000-0000-0000-0000-000000000002', -50.00, 'bet_placed', '10000000-0000-0000-0000-000000000001'),
    ('00000000-0000-0000-0000-000000000003', -30.00, 'bet_placed', '10000000-0000-0000-0000-000000000001');
