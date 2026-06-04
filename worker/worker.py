"""
Homelab SQS worker — placeholder.
Polls SQS, runs calculations, writes results back to RDS.
"""
import boto3
import os
import time

QUEUE_URL = os.environ["SQS_QUEUE_URL"]


def process_message(message: dict):
    print(f"Processing: {message}")
    # TODO: implement calculation logic


def main():
    sqs = boto3.client(
        "sqs",
        region_name=os.environ.get("AWS_DEFAULT_REGION", "us-east-1"),
        endpoint_url=os.environ.get("AWS_ENDPOINT_URL"),  # set for LocalStack, unset for real AWS
    )
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
