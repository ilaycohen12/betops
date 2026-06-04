import json
import math
import pytest
from unittest.mock import MagicMock, patch, call
from worker import lmsr_price, update_odds, settle_market, close_expired_markets, process_message


# ── LMSR ──────────────────────────────────────────────────────────────────

def test_lmsr_even_split():
    assert lmsr_price(0, 0) == pytest.approx(0.5)

def test_lmsr_yes_heavy():
    price = lmsr_price(200, 0)
    assert price > 0.85

def test_lmsr_no_heavy():
    price = lmsr_price(0, 200)
    assert price < 0.15

def test_lmsr_stays_between_0_and_1():
    for q_yes, q_no in [(0, 0), (100, 0), (0, 100), (50, 50), (1000, 1)]:
        p = lmsr_price(q_yes, q_no)
        assert 0 <= p <= 1


# ── Helpers ───────────────────────────────────────────────────────────────

def _mock_conn(fetchone=None, fetchall=None):
    conn = MagicMock()
    cur = MagicMock()
    conn.cursor.return_value.__enter__ = MagicMock(return_value=cur)
    conn.cursor.return_value.__exit__ = MagicMock(return_value=False)
    if fetchone is not None:
        cur.fetchone.return_value = fetchone
    if fetchall is not None:
        cur.fetchall.return_value = fetchall
    return conn, cur


# ── update_odds ────────────────────────────────────────────────────────────

def test_update_odds_calls_update():
    conn, cur = _mock_conn(fetchone={"q_yes": 100, "q_no": 50})
    update_odds(conn, "market-1")
    assert cur.execute.call_count == 2  # SELECT + UPDATE
    conn.commit.assert_called_once()

def test_update_odds_correct_price():
    conn, cur = _mock_conn(fetchone={"q_yes": 0, "q_no": 0})
    update_odds(conn, "market-1")
    update_call = cur.execute.call_args_list[1]
    price = update_call[0][1][0]
    assert price == pytest.approx(0.5, abs=0.01)


# ── settle_market ──────────────────────────────────────────────────────────

def test_settle_market_distributes_pool():
    conn, cur = MagicMock(), MagicMock()
    conn.cursor.return_value.__enter__ = MagicMock(return_value=cur)
    conn.cursor.return_value.__exit__ = MagicMock(return_value=False)
    cur.rowcount = 1
    cur.fetchone.return_value = {"total": 100.0}
    cur.fetchall.return_value = [
        {"user_id": "u1", "stake": 60.0},
        {"user_id": "u2", "stake": 40.0},
    ]
    settle_market(conn, "market-1", "yes")
    conn.commit.assert_called_once()

def test_settle_market_already_settled():
    conn, cur = _mock_conn()
    cur.rowcount = 0
    settle_market(conn, "market-1", "yes")
    conn.commit.assert_called_once()

def test_settle_market_no_winners():
    conn, cur = MagicMock(), MagicMock()
    conn.cursor.return_value.__enter__ = MagicMock(return_value=cur)
    conn.cursor.return_value.__exit__ = MagicMock(return_value=False)
    cur.rowcount = 1
    cur.fetchone.return_value = {"total": 100.0}
    cur.fetchall.return_value = []
    settle_market(conn, "market-1", "yes")
    conn.commit.assert_called_once()


# ── close_expired_markets ──────────────────────────────────────────────────

def test_close_expired_markets():
    conn, cur = _mock_conn(fetchall=[{"id": "m1", "question": "Will X?"}])
    close_expired_markets(conn)
    conn.commit.assert_called_once()


# ── process_message ────────────────────────────────────────────────────────

@patch("worker.update_odds")
def test_process_bet_placed(mock_update):
    conn = MagicMock()
    msg = {"Body": json.dumps({"event": "bet_placed", "market_id": "m1"})}
    process_message(conn, msg)
    mock_update.assert_called_once_with(conn, "m1")

@patch("worker.settle_market")
def test_process_settle_market(mock_settle):
    conn = MagicMock()
    msg = {"Body": json.dumps({"event": "settle_market", "market_id": "m1", "result": "yes"})}
    process_message(conn, msg)
    mock_settle.assert_called_once_with(conn, "m1", "yes")

def test_process_unknown_event():
    conn = MagicMock()
    msg = {"Body": json.dumps({"event": "unknown"})}
    process_message(conn, msg)  # should not raise
