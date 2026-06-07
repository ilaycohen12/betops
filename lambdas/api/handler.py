import datetime
import hashlib
import json
import os
import random
import secrets
import string

import boto3
import jwt
import psycopg2
import psycopg2.extras

JWT_SECRET = os.environ.get("JWT_SECRET", "dev-secret-change-in-prod")


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
            "Access-Control-Allow-Headers": "Content-Type,Authorization",
        },
        "body": json.dumps(body, default=str),
    }


def _parse_body(raw):
    try:
        return json.loads(raw or "{}"), None
    except json.JSONDecodeError:
        return None, _resp(400, {"error": "invalid JSON"})


def _invite_code():
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=6))


def _make_token(user_id):
    payload = {
        "user_id": user_id,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(days=7),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


def _require_auth(event):
    headers = event.get("headers") or {}
    header = headers.get("authorization") or headers.get("Authorization", "")
    if not header.startswith("Bearer "):
        return None, _resp(401, {"error": "authorization required"})
    token = header[7:]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return payload["user_id"], None
    except jwt.ExpiredSignatureError:
        return None, _resp(401, {"error": "token expired"})
    except jwt.InvalidTokenError:
        return None, _resp(401, {"error": "invalid token"})


# ── Auth ──────────────────────────────────────────────────────────────────

def _hash_password(password):
    salt = secrets.token_hex(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 260000)
    return f"{salt}${dk.hex()}"


def _check_password(password, stored):
    try:
        salt, dk_hex = stored.split("$")
        dk = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 260000)
        return secrets.compare_digest(dk.hex(), dk_hex)
    except Exception:
        return False


def _post_register(conn, body):
    for f in ("username", "email", "password", "first_name", "last_name"):
        if f not in body:
            return _resp(400, {"error": f"missing field: {f}"})
    pw_hash = _hash_password(body["password"])
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(
            "SELECT 1 FROM users WHERE username = %s OR email = %s",
            (body["username"], body["email"]),
        )
        if cur.fetchone():
            return _resp(409, {"error": "username or email already taken"})
        name = f"{body['first_name']} {body['last_name']}"
        cur.execute("""
            INSERT INTO users (username, email, password_hash, first_name, last_name, nickname, name)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING id, username, email, first_name, last_name, nickname, balance, created_at
        """, (
            body["username"], body["email"], pw_hash,
            body["first_name"], body["last_name"],
            body.get("nickname") or None, name,
        ))
        user = dict(cur.fetchone())
        conn.commit()
    token = _make_token(str(user["id"]))
    return _resp(201, {"token": token, "user": user})


def _post_login(conn, body):
    for f in ("username", "password"):
        if f not in body:
            return _resp(400, {"error": f"missing field: {f}"})
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute("""
            SELECT id, username, email, first_name, last_name, nickname, password_hash, balance
            FROM users WHERE username = %s
        """, (body["username"],))
        user = cur.fetchone()
    if not user or not user["password_hash"]:
        return _resp(401, {"error": "invalid credentials"})
    if not _check_password(body["password"], user["password_hash"]):
        return _resp(401, {"error": "invalid credentials"})
    user = dict(user)
    user.pop("password_hash")
    token = _make_token(str(user["id"]))
    return _resp(200, {"token": token, "user": user})


# ── Groups ────────────────────────────────────────────────────────────────

def _get_groups(conn, user_id):
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute("""
            SELECT g.id, g.name, g.invite_code, g.created_by, g.created_at,
                   gm.balance,
                   (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) AS member_count,
                   (SELECT COUNT(*) FROM markets WHERE group_id = g.id AND status = 'open') AS open_markets
            FROM groups g
            JOIN group_members gm ON gm.group_id = g.id
            WHERE gm.user_id = %s
            ORDER BY g.created_at DESC
        """, (user_id,))
        return _resp(200, [dict(r) for r in cur.fetchall()])


def _post_group(conn, user_id, body):
    if "name" not in body:
        return _resp(400, {"error": "missing field: name"})
    code = _invite_code()
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute("""
            INSERT INTO groups (name, invite_code, created_by)
            VALUES (%s, %s, %s) RETURNING id, name, invite_code, created_at
        """, (body["name"], code, user_id))
        group = cur.fetchone()
        cur.execute("""
            INSERT INTO group_members (group_id, user_id, balance)
            VALUES (%s, %s, 500.00)
        """, (group["id"], user_id))
        conn.commit()
    return _resp(201, dict(group))


def _post_join(conn, user_id, body):
    if "invite_code" not in body:
        return _resp(400, {"error": "missing field: invite_code"})
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute("SELECT id, name FROM groups WHERE invite_code = %s", (body["invite_code"].upper(),))
        group = cur.fetchone()
        if not group:
            return _resp(404, {"error": "group not found"})
        cur.execute("SELECT 1 FROM group_members WHERE group_id = %s AND user_id = %s",
                    (group["id"], user_id))
        if cur.fetchone():
            return _resp(200, {"message": "already a member", "group_id": str(group["id"])})
        cur.execute("""
            INSERT INTO group_members (group_id, user_id, balance)
            VALUES (%s, %s, 500.00)
        """, (group["id"], user_id))
        conn.commit()
    return _resp(201, {"group_id": str(group["id"]), "name": group["name"]})


def _get_group(conn, group_id, user_id):
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute("SELECT id, name, invite_code, created_by, created_at FROM groups WHERE id = %s", (group_id,))
        group = cur.fetchone()
        if not group:
            return _resp(404, {"error": "group not found"})

        cur.execute("""
            SELECT u.id, u.name, u.first_name, u.last_name, u.nickname, gm.balance, gm.joined_at
            FROM group_members gm JOIN users u ON u.id = gm.user_id
            WHERE gm.group_id = %s
            ORDER BY gm.balance DESC
        """, (group_id,))
        members = [dict(r) for r in cur.fetchall()]

        cur.execute("""
            SELECT id, question, description, status, result,
                   yes_price, ROUND(yes_price * 100) AS yes_pct,
                   ROUND((1 - yes_price) * 100) AS no_pct,
                   closes_at, created_at, created_by
            FROM markets WHERE group_id = %s
            ORDER BY created_at DESC
        """, (group_id,))
        markets = [dict(r) for r in cur.fetchall()]

    result = dict(group)
    result["members"] = members
    result["markets"] = markets
    return _resp(200, result)


def _post_group_market(conn, group_id, user_id, body):
    if "question" not in body:
        return _resp(400, {"error": "missing field: question"})
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute("SELECT 1 FROM group_members WHERE group_id = %s AND user_id = %s",
                    (group_id, user_id))
        if not cur.fetchone():
            return _resp(403, {"error": "not a member of this group"})
        cur.execute("""
            INSERT INTO markets (question, description, group_id, created_by, closes_at)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id, question, yes_price, status, created_at
        """, (body["question"], body.get("description"), group_id,
              user_id, body.get("closes_at")))
        market = cur.fetchone()
        conn.commit()
    return _resp(201, dict(market))


def _post_resolve(conn, market_id, body):
    if "result" not in body:
        return _resp(400, {"error": "missing field: result"})
    if body["result"] not in ("yes", "no"):
        return _resp(400, {"error": "result must be 'yes' or 'no'"})

    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute("SELECT id, group_id, status FROM markets WHERE id = %s", (market_id,))
        market = cur.fetchone()
        if not market:
            return _resp(404, {"error": "market not found"})
        if market["status"] == "settled":
            return _resp(400, {"error": "market already settled"})

        cur.execute("UPDATE markets SET status = 'closed' WHERE id = %s", (market_id,))
        conn.commit()

    queue_url = os.environ.get("SQS_QUEUE_URL", "")
    if queue_url:
        _get_sqs().send_message(
            QueueUrl=queue_url,
            MessageBody=json.dumps({
                "event": "settle_market",
                "market_id": str(market_id),
                "result": body["result"],
            }),
        )
    return _resp(200, {"message": "settlement triggered", "result": body["result"]})


# ── Bets ──────────────────────────────────────────────────────────────────

def _post_bet(conn, user_id, raw_body):
    data, err = _parse_body(raw_body)
    if err:
        return err
    for f in ("market_id", "side", "amount"):
        if f not in data:
            return _resp(400, {"error": f"missing field: {f}"})
    if data["side"] not in ("yes", "no"):
        return _resp(400, {"error": "side must be 'yes' or 'no'"})
    try:
        amount = float(data["amount"])
    except (TypeError, ValueError):
        return _resp(400, {"error": "amount must be a number"})
    if amount <= 0:
        return _resp(400, {"error": "amount must be positive"})

    group_id = data.get("group_id")

    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        if group_id:
            cur.execute("SELECT balance FROM group_members WHERE group_id = %s AND user_id = %s FOR UPDATE",
                        (group_id, user_id))
            member = cur.fetchone()
            if not member:
                return _resp(403, {"error": "not a member of this group"})
            if float(member["balance"]) < amount:
                return _resp(400, {"error": "insufficient balance"})
        else:
            cur.execute("SELECT balance FROM users WHERE id = %s FOR UPDATE", (user_id,))
            user_row = cur.fetchone()
            if not user_row:
                return _resp(404, {"error": "user not found"})
            if float(user_row["balance"]) < amount:
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
        """, (user_id, data["market_id"], data["side"], amount, yes_price))
        bet = cur.fetchone()

        if group_id:
            cur.execute("UPDATE group_members SET balance = balance - %s WHERE group_id = %s AND user_id = %s",
                        (amount, group_id, user_id))
        else:
            cur.execute("UPDATE users SET balance = balance - %s WHERE id = %s", (amount, user_id))

        cur.execute("""
            INSERT INTO transactions (user_id, amount, type, reference_id)
            VALUES (%s, %s, 'bet_placed', %s)
        """, (user_id, -amount, data["market_id"]))
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


# ── Migration schemas ─────────────────────────────────────────────────────

SCHEMA_V1 = """
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE, name TEXT NOT NULL DEFAULT '',
    balance NUMERIC(10,2) NOT NULL DEFAULT 500.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS markets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question TEXT NOT NULL, description TEXT,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed','settled')),
    result TEXT CHECK (result IN ('yes','no')),
    yes_price NUMERIC(5,2) NOT NULL DEFAULT 0.50,
    created_by UUID NOT NULL REFERENCES users(id),
    closes_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS bets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    market_id UUID NOT NULL REFERENCES markets(id),
    side TEXT NOT NULL CHECK (side IN ('yes','no')),
    amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
    yes_price NUMERIC(5,2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    amount NUMERIC(10,2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('bet_placed','payout','deposit')),
    reference_id UUID, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS bets_market_id_idx ON bets (market_id);
CREATE INDEX IF NOT EXISTS bets_user_id_idx ON bets (user_id);
CREATE INDEX IF NOT EXISTS transactions_user_id_idx ON transactions (user_id);
"""

SCHEMA_V2 = """
CREATE TABLE IF NOT EXISTS groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    invite_code TEXT NOT NULL UNIQUE,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS group_members (
    group_id UUID NOT NULL REFERENCES groups(id),
    user_id UUID NOT NULL REFERENCES users(id),
    balance NUMERIC(10,2) NOT NULL DEFAULT 500.00,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (group_id, user_id)
);
ALTER TABLE markets ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES groups(id);
CREATE INDEX IF NOT EXISTS markets_group_id_idx ON markets (group_id);
CREATE INDEX IF NOT EXISTS group_members_user_id_idx ON group_members (user_id);
"""

SCHEMA_V3 = """
ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS nickname TEXT;
"""


# ── Router ────────────────────────────────────────────────────────────────

def lambda_handler(event, context):
    if event.get("action") == "migrate":
        try:
            conn = _get_db_conn()
            with conn.cursor() as cur:
                cur.execute(SCHEMA_V1)
                cur.execute(SCHEMA_V2)
                cur.execute(SCHEMA_V3)
            conn.commit()
            conn.close()
            return {"status": "migration complete"}
        except Exception as e:
            return {"status": "error", "error": str(e)}

    if event.get("action") == "seed":
        try:
            conn = _get_db_conn()
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO users (id, email, name, balance) VALUES
                        ('00000000-0000-0000-0000-000000000001','alice@example.com','Alice',500),
                        ('00000000-0000-0000-0000-000000000002','bob@example.com','Bob',500),
                        ('00000000-0000-0000-0000-000000000003','charlie@example.com','Charlie',500)
                    ON CONFLICT DO NOTHING;
                    INSERT INTO markets (id, question, description, yes_price, created_by, closes_at) VALUES
                        ('10000000-0000-0000-0000-000000000001','Will Man City finish top 4 this season?','Premier League 2025/26',0.54,'00000000-0000-0000-0000-000000000001','2026-05-20 00:00:00+00'),
                        ('10000000-0000-0000-0000-000000000002','Will GPT-5 be released before end of 2025?',NULL,0.81,'00000000-0000-0000-0000-000000000002','2025-12-31 00:00:00+00')
                    ON CONFLICT DO NOTHING;
                """)
            conn.commit()
            conn.close()
            return {"status": "seed complete"}
        except Exception as e:
            return {"status": "error", "error": str(e)}

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

    parts = [p for p in path.split("/") if p]

    # ── Public auth routes ────────────────────────────────────────────────
    if path in ("/auth/register", "/auth/login") and method == "POST":
        try:
            conn = _get_db_conn()
        except Exception as e:
            return _resp(500, {"error": f"db connection failed: {e}"})
        try:
            data, err = _parse_body(event.get("body"))
            if err:
                return err
            if path == "/auth/register":
                return _post_register(conn, data)
            return _post_login(conn, data)
        finally:
            conn.close()

    # ── All other routes require a valid JWT ──────────────────────────────
    user_id, auth_err = _require_auth(event)
    if auth_err:
        return auth_err

    try:
        conn = _get_db_conn()
    except Exception as e:
        return _resp(500, {"error": f"db connection failed: {e}"})

    try:
        if path == "/markets" and method == "GET":
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                cur.execute("""
                    SELECT id, question, description, status, yes_price,
                           ROUND(yes_price*100) AS yes_pct,
                           ROUND((1-yes_price)*100) AS no_pct,
                           closes_at, created_at
                    FROM markets WHERE status='open' ORDER BY created_at DESC
                """)
                return _resp(200, [dict(r) for r in cur.fetchall()])

        if path == "/bets" and method == "POST":
            return _post_bet(conn, user_id, event.get("body"))

        if path == "/groups" and method == "GET":
            return _get_groups(conn, user_id)

        if path == "/groups" and method == "POST":
            data, err = _parse_body(event.get("body"))
            if err:
                return err
            return _post_group(conn, user_id, data)

        if path == "/groups/join" and method == "POST":
            data, err = _parse_body(event.get("body"))
            if err:
                return err
            return _post_join(conn, user_id, data)

        if len(parts) == 2 and parts[0] == "groups" and method == "GET":
            return _get_group(conn, parts[1], user_id)

        if len(parts) == 3 and parts[0] == "groups" and parts[2] == "markets" and method == "POST":
            data, err = _parse_body(event.get("body"))
            if err:
                return err
            return _post_group_market(conn, parts[1], user_id, data)

        if len(parts) == 3 and parts[0] == "markets" and parts[2] == "resolve" and method == "POST":
            data, err = _parse_body(event.get("body"))
            if err:
                return err
            return _post_resolve(conn, parts[1], data)

        return _resp(404, {"error": "not found"})
    finally:
        conn.close()
