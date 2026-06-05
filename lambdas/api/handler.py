import json
import os
import boto3
import psycopg2
import psycopg2.extras


def _get_db_conn():
    if os.environ.get("DB_SECRET_ARN"):
        sm = boto3.client("secretsmanager")
        secret = json.loads(
            sm.get_secret_value(SecretId=os.environ["DB_SECRET_ARN"])["SecretString"]
        )
        return psycopg2.connect(
            host=secret["host"], port=secret["port"],
            dbname=secret["dbname"], user=secret["username"], password=secret["password"],
        )
    return psycopg2.connect(
        host=os.environ.get("DB_HOST", "localhost"),
        port=int(os.environ.get("DB_PORT", 5432)),
        dbname=os.environ.get("DB_NAME", "betops"),
        user=os.environ.get("DB_USER", "betops"),
        password=os.environ.get("DB_PASSWORD", "betops"),
    )


def _get_sqs():
    return boto3.client(
        "sqs",
        region_name=os.environ.get("AWS_DEFAULT_REGION", "us-east-1"),
        endpoint_url=os.environ.get("AWS_ENDPOINT_URL"),
    )


def _resp(status, body):
    return {
        "statusCode": status,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        },
        "body": json.dumps(body, default=str),
    }


def _get_markets(conn):
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute("""
            SELECT id, question, description, status,
                   yes_price, ROUND((1 - yes_price) * 100) AS no_pct,
                   ROUND(yes_price * 100) AS yes_pct,
                   closes_at, created_at
            FROM markets
            WHERE status = 'open'
            ORDER BY created_at DESC
        """)
        return _resp(200, [dict(r) for r in cur.fetchall()])


def _post_bet(conn, raw_body):
    try:
        data = json.loads(raw_body or "{}")
    except json.JSONDecodeError:
        return _resp(400, {"error": "invalid JSON"})

    for field in ("user_id", "market_id", "side", "amount"):
        if field not in data:
            return _resp(400, {"error": f"missing field: {field}"})

    if data["side"] not in ("yes", "no"):
        return _resp(400, {"error": "side must be 'yes' or 'no'"})

    try:
        amount = float(data["amount"])
    except (TypeError, ValueError):
        return _resp(400, {"error": "amount must be a number"})

    if amount <= 0:
        return _resp(400, {"error": "amount must be positive"})

    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute("SELECT balance FROM users WHERE id = %s FOR UPDATE", (data["user_id"],))
        user = cur.fetchone()
        if not user:
            return _resp(404, {"error": "user not found"})
        if float(user["balance"]) < amount:
            return _resp(400, {"error": "insufficient balance"})

        cur.execute("SELECT id, yes_price, status FROM markets WHERE id = %s", (data["market_id"],))
        market = cur.fetchone()
        if not market:
            return _resp(404, {"error": "market not found"})
        if market["status"] != "open":
            return _resp(400, {"error": "market is not open"})

        yes_price = float(market["yes_price"])

        cur.execute("""
            INSERT INTO bets (user_id, market_id, side, amount, yes_price)
            VALUES (%s, %s, %s, %s, %s) RETURNING id, created_at
        """, (data["user_id"], data["market_id"], data["side"], amount, yes_price))
        bet = cur.fetchone()

        cur.execute("UPDATE users SET balance = balance - %s WHERE id = %s", (amount, data["user_id"]))

        cur.execute("""
            INSERT INTO transactions (user_id, amount, type, reference_id)
            VALUES (%s, %s, 'bet_placed', %s)
        """, (data["user_id"], -amount, data["market_id"]))

        conn.commit()

    queue_url = os.environ.get("SQS_QUEUE_URL", "")
    if queue_url:
        _get_sqs().send_message(
            QueueUrl=queue_url,
            MessageBody=json.dumps({
                "event": "bet_placed",
                "market_id": str(data["market_id"]),
                "side": data["side"],
                "amount": amount,
            }),
        )

    return _resp(201, {
        "bet_id": str(bet["id"]),
        "market_id": data["market_id"],
        "side": data["side"],
        "amount": amount,
        "yes_price": yes_price,
        "created_at": str(bet["created_at"]),
    })


SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email      TEXT NOT NULL UNIQUE,
    name       TEXT NOT NULL,
    balance    NUMERIC(10, 2) NOT NULL DEFAULT 500.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS markets (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question    TEXT NOT NULL,
    description TEXT,
    status      TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'settled')),
    result      TEXT CHECK (result IN ('yes', 'no')),
    yes_price   NUMERIC(5, 2) NOT NULL DEFAULT 0.50,
    created_by  UUID NOT NULL REFERENCES users(id),
    closes_at   TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS bets (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id),
    market_id   UUID NOT NULL REFERENCES markets(id),
    side        TEXT NOT NULL CHECK (side IN ('yes', 'no')),
    amount      NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    yes_price   NUMERIC(5, 2) NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS transactions (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES users(id),
    amount       NUMERIC(10, 2) NOT NULL,
    type         TEXT NOT NULL CHECK (type IN ('bet_placed', 'payout', 'deposit')),
    reference_id UUID,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS bets_market_id_idx ON bets (market_id);
CREATE INDEX IF NOT EXISTS bets_user_id_idx ON bets (user_id);
CREATE INDEX IF NOT EXISTS transactions_user_id_idx ON transactions (user_id);
"""


def lambda_handler(event, context):
    if event.get("action") == "seed":
        try:
            conn = _get_db_conn()
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO users (id, email, name, balance) VALUES
                        ('00000000-0000-0000-0000-000000000001', 'alice@example.com', 'Alice', 500.00),
                        ('00000000-0000-0000-0000-000000000002', 'bob@example.com', 'Bob', 500.00),
                        ('00000000-0000-0000-0000-000000000003', 'charlie@example.com', 'Charlie', 500.00)
                    ON CONFLICT DO NOTHING;

                    INSERT INTO markets (id, question, description, yes_price, created_by, closes_at) VALUES
                        ('10000000-0000-0000-0000-000000000001', 'Will Man City finish top 4 this season?', 'Premier League 2025/26', 0.54, '00000000-0000-0000-0000-000000000001', '2026-05-20 00:00:00+00'),
                        ('10000000-0000-0000-0000-000000000002', 'Will GPT-5 be released before end of 2025?', NULL, 0.81, '00000000-0000-0000-0000-000000000002', '2025-12-31 00:00:00+00')
                    ON CONFLICT DO NOTHING;
                """)
            conn.commit()
            conn.close()
            return {"status": "seed complete"}
        except Exception as e:
            return {"status": "error", "error": str(e)}

    # Direct Lambda invocation for migrations (not via API Gateway)
    if event.get("action") == "migrate":
        try:
            conn = _get_db_conn()
            with conn.cursor() as cur:
                cur.execute(SCHEMA)
            conn.commit()
            conn.close()
            return {"status": "migration complete"}
        except Exception as e:
            return {"status": "error", "error": str(e)}

    # Support both API Gateway v1 (httpMethod/path) and v2 (requestContext.http)
    if "requestContext" in event and "http" in event.get("requestContext", {}):
        method = event["requestContext"]["http"]["method"]
        path = event.get("rawPath", "/")
    else:
        method = event.get("httpMethod", "GET")
        path = event.get("path", "/")

    if method == "OPTIONS":
        return _resp(200, {})

    if path == "/health":
        return _resp(200, {"status": "ok"})

    if path == "/markets" and method == "GET":
        try:
            conn = _get_db_conn()
        except Exception as e:
            return _resp(500, {"error": f"db connection failed: {e}"})
        try:
            return _get_markets(conn)
        finally:
            conn.close()

    if path == "/bets" and method == "POST":
        # validate before touching DB
        try:
            data = json.loads(event.get("body") or "{}")
        except json.JSONDecodeError:
            return _resp(400, {"error": "invalid JSON"})
        for field in ("user_id", "market_id", "side", "amount"):
            if field not in data:
                return _resp(400, {"error": f"missing field: {field}"})
        if data["side"] not in ("yes", "no"):
            return _resp(400, {"error": "side must be 'yes' or 'no'"})
        try:
            conn = _get_db_conn()
        except Exception as e:
            return _resp(500, {"error": f"db connection failed: {e}"})
        try:
            return _post_bet(conn, event.get("body"))
        finally:
            conn.close()

    return _resp(404, {"error": "not found"})
