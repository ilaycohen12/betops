import os
import time
import logging

import boto3
from prometheus_client import start_http_server, Gauge

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)

QUEUE_URL = os.environ["SQS_QUEUE_URL"]
QUEUE_NAME = QUEUE_URL.split("/")[-1]
SCRAPE_INTERVAL = int(os.environ.get("SCRAPE_INTERVAL", "30"))
PORT = int(os.environ.get("PORT", "8000"))

messages_visible = Gauge(
    "sqs_messages_visible",
    "Number of messages available in the SQS queue",
    ["queue_name"],
)
messages_not_visible = Gauge(
    "sqs_messages_not_visible",
    "Number of messages in flight (being processed)",
    ["queue_name"],
)


def collect():
    sqs = boto3.client("sqs", region_name=os.environ.get("AWS_DEFAULT_REGION", "us-east-1"))
    attrs = sqs.get_queue_attributes(
        QueueUrl=QUEUE_URL,
        AttributeNames=["ApproximateNumberOfMessages", "ApproximateNumberOfMessagesNotVisible"],
    )["Attributes"]
    messages_visible.labels(queue_name=QUEUE_NAME).set(int(attrs["ApproximateNumberOfMessages"]))
    messages_not_visible.labels(queue_name=QUEUE_NAME).set(int(attrs["ApproximateNumberOfMessagesNotVisible"]))
    log.info("queue=%s visible=%s in_flight=%s", QUEUE_NAME, attrs["ApproximateNumberOfMessages"], attrs["ApproximateNumberOfMessagesNotVisible"])


if __name__ == "__main__":
    start_http_server(PORT)
    log.info("SQS exporter started on port %d", PORT)
    while True:
        try:
            collect()
        except Exception as e:
            log.error("Failed to collect SQS metrics: %s", e)
        time.sleep(SCRAPE_INTERVAL)
