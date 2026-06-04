import json
import pytest
from unittest.mock import MagicMock, patch


@pytest.fixture
def ctx():
    class MockContext:
        function_name = "betops-api"
        aws_request_id = "test-id"
    return MockContext()


def _event(method, path, body=None):
    return {
        "requestContext": {"http": {"method": method, "path": path}},
        "rawPath": path,
        "body": json.dumps(body) if body else None,
    }


def _mock_conn(markets=None, user=None, market=None, bet=None):
    """Build a mock psycopg2 connection with configurable query results."""
    conn = MagicMock()
    cur = MagicMock()
    conn.cursor.return_value.__enter__ = MagicMock(return_value=cur)
    conn.cursor.return_value.__exit__ = MagicMock(return_value=False)

    results = []
    if markets is not None:
        results.append(markets)        # fetchall for GET /markets
    if user is not None:
        results.append(user)           # fetchone for user balance check
    if market is not None:
        results.append(market)         # fetchone for market check
    if bet is not None:
        results.append(bet)            # fetchone for INSERT RETURNING

    cur.fetchall.side_effect = [r for r in results if isinstance(r, list)]
    cur.fetchone.side_effect = [r for r in results if not isinstance(r, list)]
    return conn


# ── /health ────────────────────────────────────────────────────────────────

def test_health_check(ctx):
    from handler import lambda_handler
    resp = lambda_handler(_event("GET", "/health"), ctx)
    assert resp["statusCode"] == 200
    assert json.loads(resp["body"])["status"] == "ok"


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
        "user_id": "usr-1", "market_id": "mkt-1", "side": "yes", "amount": 50
    }), ctx)
    assert resp["statusCode"] == 201
    body = json.loads(resp["body"])
    assert body["side"] == "yes"
    assert body["amount"] == 50.0


def test_post_bet_missing_field(ctx):
    from handler import lambda_handler
    resp = lambda_handler(_event("POST", "/bets", {"user_id": "x"}), ctx)
    assert resp["statusCode"] == 400
    assert "missing field" in json.loads(resp["body"])["error"]


def test_post_bet_invalid_side(ctx):
    from handler import lambda_handler
    resp = lambda_handler(_event("POST", "/bets", {
        "user_id": "u", "market_id": "m", "side": "maybe", "amount": 10
    }), ctx)
    assert resp["statusCode"] == 400


@patch("handler._get_db_conn")
def test_post_bet_insufficient_balance(mock_db, ctx):
    mock_db.return_value = _mock_conn(user={"balance": 5.0})
    from handler import lambda_handler
    resp = lambda_handler(_event("POST", "/bets", {
        "user_id": "u", "market_id": "m", "side": "yes", "amount": 100
    }), ctx)
    assert resp["statusCode"] == 400
    assert "insufficient" in json.loads(resp["body"])["error"]


@patch("handler._get_db_conn")
def test_post_bet_user_not_found(mock_db, ctx):
    mock_db.return_value = _mock_conn(user=None)
    from handler import lambda_handler
    resp = lambda_handler(_event("POST", "/bets", {
        "user_id": "u", "market_id": "m", "side": "yes", "amount": 10
    }), ctx)
    assert resp["statusCode"] == 404


# ── 404 ────────────────────────────────────────────────────────────────────

def test_unknown_route(ctx):
    from handler import lambda_handler
    resp = lambda_handler(_event("GET", "/unknown"), ctx)
    assert resp["statusCode"] == 404
