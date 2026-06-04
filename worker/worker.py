import boto3
import json
import logging
import math
import os
import time

import psycopg2
import psycopg2.extras

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)

QUEUE_URL = os.environ.get("SQS_QUEUE_URL", "")
LMSR_B = float(os.environ.get("LMSR_B", "100"))


def get_db():
    return psycopg2.connect(
        host=os.environ["DB_HOST"],
        port=int(os.environ.get("DB_PORT", 5432)),
        dbname=os.environ["DB_NAME"],
        user=os.environ["DB_USER"],
        password=os.environ["DB_PASSWORD"],
    )


def get_sqs():
    return boto3.client(
        "sqs",
        region_name=os.environ.get("AWS_DEFAULT_REGION", "us-east-1"),
        endpoint_url=os.environ.get("AWS_ENDPOINT_URL"),
    )


def lmsr_price(q_yes: float, q_no: float, b: float = LMSR_B) -> float:
    """YES probability using the Logarithmic Market Scoring Rule."""
    try:
        exp_yes = math.exp(q_yes / b)
        exp_no = math.exp(q_no / b)
        return exp_yes / (exp_yes + exp_no)
    except OverflowError:
        return 1.0 if q_yes > q_no else 0.0


def update_odds(conn, market_id: str):
    """Recalculate and store market odds after a new bet."""
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute("""
            SELECT
                COALESCE(SUM(amount) FILTER (WHERE side = 'yes'), 0) AS q_yes,
                COALESCE(SUM(amount) FILTER (WHERE side = 'no'),  0) AS q_no
            FROM bets WHERE market_id = %s
        """, (market_id,))
        row = cur.fetchone()
        yes_price = lmsr_price(float(row["q_yes"]), float(row["q_no"]))
        cur.execute(
            "UPDATE markets SET yes_price = %s WHERE id = %s AND status = 'open'",
            (round(yes_price, 4), market_id),
        )
        conn.commit()
    log.info("Updated odds market=%s yes=%.2f%%", market_id, yes_price * 100)


def settle_market(conn, market_id: str, result: str):
    """Distribute the total pool to winners proportionally."""
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute("""
            UPDATE markets SET status = 'settled', result = %s
            WHERE id = %s AND status IN ('open', 'closed')
        """, (result, market_id))
        if cur.rowcount == 0:
            log.info("Market %s already settled, skipping", market_id)
            conn.commit()
            return

        cur.execute("SELECT COALESCE(SUM(amount), 0) AS total FROM bets WHERE market_id = %s", (market_id,))
        total_pool = float(cur.fetchone()["total"])

        cur.execute("""
            SELECT user_id, SUM(amount) AS stake
            FROM bets WHERE market_id = %s AND side = %s
            GROUP BY user_id
        """, (market_id, result))
        winners = cur.fetchall()

        if not winners:
            log.info("No winners for market %s", market_id)
            conn.commit()
            return

        total_stake = sum(float(w["stake"]) for w in winners)
        for w in winners:
            payout = round((float(w["stake"]) / total_stake) * total_pool, 2)
            cur.execute("UPDATE users SET balance = balance + %s WHERE id = %s", (payout, w["user_id"]))
            cur.execute("""
                INSERT INTO transactions (user_id, amount, type, reference_id)
                VALUES (%s, %s, 'payout', %s)
            """, (w["user_id"], payout, market_id))

        conn.commit()
    log.info("Settled market=%s result=%s pool=$%.2f winners=%d", market_id, result, total_pool, len(winners))


def close_expired_markets(conn):
    """Mark markets past their closes_at as closed (awaiting resolution)."""
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute("""
            UPDATE markets SET status = 'closed'
            WHERE status = 'open' AND closes_at IS NOT NULL AND closes_at < now()
            RETURNING id, question
        """)
        expired = cur.fetchall()
        conn.commit()
    for m in expired:
        log.info("Auto-closed expired market: %s (%s)", m["question"], m["id"])


def process_message(conn, message: dict):
    body = json.loads(message["Body"])
    event = body.get("event")
    if event == "bet_placed":
        update_odds(conn, body["market_id"])
    elif event == "settle_market":
        settle_market(conn, body["market_id"], body["result"])
    else:
        log.warning("Unknown event: %s", event)


def main():
    sqs = get_sqs()
    log.info("Worker started, polling SQS...")
    iteration = 0
    while True:
        try:
            conn = get_db()
            try:
                if iteration % 3 == 0:
                    close_expired_markets(conn)
                if QUEUE_URL:
                    response = sqs.receive_message(
                        QueueUrl=QUEUE_URL,
                        MaxNumberOfMessages=10,
                        WaitTimeSeconds=20,
                    )
                    for msg in response.get("Messages", []):
                        try:
                            process_message(conn, msg)
                            sqs.delete_message(QueueUrl=QUEUE_URL, ReceiptHandle=msg["ReceiptHandle"])
                        except Exception as e:
                            log.error("Failed to process message: %s", e)
            finally:
                conn.close()
        except Exception as e:
            log.error("Worker error: %s", e)
            time.sleep(5)
        iteration += 1
        time.sleep(1)


if __name__ == "__main__":
    main()
