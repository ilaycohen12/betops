#!/bin/bash
# Runs inside LocalStack on startup — creates the SQS queues automatically
awslocal sqs create-queue --queue-name betops-dlq --region us-east-1
awslocal sqs create-queue \
  --queue-name betops-queue \
  --region us-east-1 \
  --attributes '{
    "VisibilityTimeout": "30",
    "MessageRetentionPeriod": "86400",
    "RedrivePolicy": "{\"deadLetterTargetArn\":\"arn:aws:sqs:us-east-1:000000000000:betops-dlq\",\"maxReceiveCount\":\"3\"}"
  }'
echo "SQS queues created"
