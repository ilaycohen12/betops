# ─── DEAD LETTER QUEUE ─────────────────────────────────────────────────────
# Messages that fail processing maxReceiveCount times go here
resource "aws_sqs_queue" "dlq" {
  name                      = "${var.project}-dlq"
  message_retention_seconds = 1209600 # 14 days — gives you time to inspect failures

  tags = var.tags
}

# ─── MAIN QUEUE ────────────────────────────────────────────────────────────
resource "aws_sqs_queue" "main" {
  name                       = "${var.project}-queue"
  visibility_timeout_seconds = 30
  message_retention_seconds  = 86400 # 1 day

  # If a message fails 3 times, move it to the DLQ
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.dlq.arn
    maxReceiveCount     = 3
  })

  tags = var.tags
}

# ─── IAM POLICY FOR WORKER ─────────────────────────────────────────────────
# Attach this to the homelab worker's IAM user/role
resource "aws_iam_policy" "worker" {
  name        = "${var.project}-worker-sqs"
  description = "Allows the homelab worker to poll and process the SQS queue"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "sqs:ReceiveMessage",
        "sqs:DeleteMessage",
        "sqs:GetQueueAttributes",
        "sqs:GetQueueUrl"
      ]
      Resource = aws_sqs_queue.main.arn
    }]
  })

  tags = var.tags
}
