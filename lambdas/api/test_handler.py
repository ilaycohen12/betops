import json
import jwt
import pytest
from unittest.mock import MagicMock, patch

TEST_USER_ID = "00000000-0000-0000-0000-000000000001"
JWT_SECRET = "dev-secret-change-in-prod"


@pytest.fixture
def ctx():
    class MockContext:
        function_name = "betops-api"
        aws_request_id = "test-id"
    return MockContext()


def _token(user_id=TEST_USER_ID):
    return jwt.encode({"user_id": user_id, "exp": 9999999999}, JWT_SECRET, algorithm="HS256")


def _event(method, path, body=None, auth=True):
    headers = {"authorization": f"Bearer {_token()}"} if auth else {}
    return {
        "requestContext": {"http": {"method": method, "path": path}},
        "rawPath": path,
        "body": json.dumps(body) if body else None,
        "headers": headers,
    }


_SKIP = object()

def _mock_conn(markets=_SKIP, user=_SKIP, market=_SKIP, bet=_SKIP):
    conn = MagicMock()
    cur = MagicMock()
    conn.cursor.return_value.__enter__ = MagicMock(return_value=cur)
    conn.cursor.return_value.__exit__ = MagicMock(return_value=False)
    if markets is not _SKIP:
        cur.fetchall.return_value = markets
    if user is not _SKIP or market is not _SKIP or bet is not _SKIP:
        fetchone_results = [v for v in (user, market, bet) if v is not _SKIP]
        cur.fetchone.side_effect = fetchone_results
    return conn


# ── /health ────────────────────────────────────────────────────────────────

def test_health_check(ctx):
    from handler import lambda_handler
    resp = lambda_handler(_event("GET", "/health", auth=False), ctx)
    assert resp["statusCode"] == 200
    assert json.loads(resp["body"])["status"] == "ok"


# ── Auth ───────────────────────────────────────────────────────────────────

@patch("handler._get_db_conn")
def test_register_success(mock_db, ctx):
    cur = MagicMock()
    cur.fetchone.side_effect = [None, {
        "id": TEST_USER_ID, "username": "johndoe", "email": "john@example.com",
        "first_name": "John", "last_name": "Doe", "nickname": "jd",
        "balance": 500.0, "created_at": "2026-01-01",
    }]
    conn = MagicMock()
    conn.cursor.return_value.__enter__ = MagicMock(return_value=cur)
    conn.cursor.return_value.__exit__ = MagicMock(return_value=False)
    mock_db.return_value = conn

    from handler import lambda_handler
    resp = lambda_handler(_event("POST", "/auth/register", {
        "username": "johndoe", "email": "john@example.com", "password": "secret",
        "first_name": "John", "last_name": "Doe", "nickname": "jd",
    }, auth=False), ctx)
    assert resp["statusCode"] == 201
    body = json.loads(resp["body"])
    assert "token" in body
    assert body["user"]["username"] == "johndoe"


@patch("handler._get_db_conn")
def test_register_missing_field(mock_db, ctx):
    mock_db.return_value = _mock_conn()
    from handler import lambda_handler
    resp = lambda_handler(_event("POST", "/auth/register", {
        "username": "johndoe", "password": "secret",
    }, auth=False), ctx)
    assert resp["statusCode"] == 400
    assert "missing field" in json.loads(resp["body"])["error"]


@patch("handler._get_db_conn")
def test_login_invalid_credentials(mock_db, ctx):
    mock_db.return_value = _mock_conn(user=None)
    from handler import lambda_handler
    resp = lambda_handler(_event("POST", "/auth/login", {
        "username": "johndoe", "password": "wrong",
    }, auth=False), ctx)
    assert resp["statusCode"] == 401


# ── No token → 401 ─────────────────────────────────────────────────────────

def test_no_token_returns_401(ctx):
    from handler import lambda_handler
    resp = lambda_handler(_event("GET", "/markets", auth=False), ctx)
    assert resp["statusCode"] == 401


# ── GET /markets ────────────────────────────────────────────────────────────

@patch("handler._get_db_conn")
def test_get_markets_returns_list(mock_db, ctx):
    mock_db.return_value = _mock_conn(markets=[
        {"id": "abc", "question": "Will X happen?", "yes_price": 0.6,
         "yes_pct": 60, "no_pct": 40, "status": "open",
         "description": None, "closes_at": None, "created_at": "2026-01-01"}
    ])
    from handler import lambda_handler
    resp = lambda_handler(_event("GET", "/markets"), ctx)
    assert resp["statusCode"] == 200
    body = json.loads(resp["body"])
    assert isinstance(body, list)
    assert body[0]["question"] == "Will X happen?"


@patch("handler._get_db_conn")
def test_get_markets_empty(mock_db, ctx):
    mock_db.return_value = _mock_conn(markets=[])
    from handler import lambda_handler
    resp = lambda_handler(_event("GET", "/markets"), ctx)
    assert resp["statusCode"] == 200
    assert json.loads(resp["body"]) == []


# ── POST /bets ──────────────────────────────────────────────────────────────

@patch("handler._get_sqs")
@patch("handler._get_db_conn")
def test_post_bet_success(mock_db, mock_sqs, ctx):
    mock_db.return_value = _mock_conn(
        user={"balance": 500.0},
        market={"id": "mkt-1", "yes_price": 0.6, "status": "open"},
        bet={"id": "bet-1", "created_at": "2026-01-01"},
    )
    mock_sqs.return_value = MagicMock()
    from handler import lambda_handler
    resp = lambda_handler(_event("POST", "/bets", {
        "market_id": "mkt-1", "side": "yes", "amount": 50
    }), ctx)
    assert resp["statusCode"] == 201
    body = json.loads(resp["body"])
    assert body["side"] == "yes"
    assert body["amount"] == 50.0


@patch("handler._get_db_conn")
def test_post_bet_missing_field(mock_db, ctx):
    mock_db.return_value = _mock_conn()
    from handler import lambda_handler
    resp = lambda_handler(_event("POST", "/bets", {"side": "yes"}), ctx)
    assert resp["statusCode"] == 400
    assert "missing field" in json.loads(resp["body"])["error"]


@patch("handler._get_db_conn")
def test_post_bet_invalid_side(mock_db, ctx):
    mock_db.return_value = _mock_conn()
    from handler import lambda_handler
    resp = lambda_handler(_event("POST", "/bets", {
        "market_id": "m", "side": "maybe", "amount": 10
    }), ctx)
    assert resp["statusCode"] == 400


@patch("handler._get_db_conn")
def test_post_bet_insufficient_balance(mock_db, ctx):
    mock_db.return_value = _mock_conn(user={"balance": 5.0})
    from handler import lambda_handler
    resp = lambda_handler(_event("POST", "/bets", {
        "market_id": "m", "side": "yes", "amount": 100
    }), ctx)
    assert resp["statusCode"] == 400
    assert "insufficient" in json.loads(resp["body"])["error"]


@patch("handler._get_db_conn")
def test_post_bet_user_not_found(mock_db, ctx):
    mock_db.return_value = _mock_conn(user=None)
    from handler import lambda_handler
    resp = lambda_handler(_event("POST", "/bets", {
        "market_id": "m", "side": "yes", "amount": 10
    }), ctx)
    assert resp["statusCode"] == 404


# ── 404 ────────────────────────────────────────────────────────────────────

@patch("handler._get_db_conn")
def test_unknown_route(mock_db, ctx):
    mock_db.return_value = _mock_conn()
    from handler import lambda_handler
    resp = lambda_handler(_event("GET", "/unknown"), ctx)
    assert resp["statusCode"] == 404
