"""
Homelab SQS worker — placeholder.
Polls SQS, runs calculations, writes results back to RDS.
"""
import boto3
import time

QUEUE_URL = "REPLACE_WITH_SQS_URL"


def process_message(message: dict):
    """Run odds/settlement calculation for a bet event."""
    print(f"Processing: {message}")
    # TODO: implement calculation logic


def main():
    sqs = boto3.client("sqs", region_name="us-east-1")
    print("Worker started, polling SQS...")
    while True:
        response = sqs.receive_message(
            QueueUrl=QUEUE_URL,
            MaxNumberOfMessages=10,
            WaitTimeSeconds=20,
        )
        for msg in response.get("Messages", []):
            process_message(msg)
            sqs.delete_message(
                QueueUrl=QUEUE_URL,
                ReceiptHandle=msg["ReceiptHandle"],
            )
        time.sleep(1)


if __name__ == "__main__":
    main()
