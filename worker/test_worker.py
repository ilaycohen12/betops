"""
Tests for the homelab SQS worker.
Uses mocking so no real AWS calls are made.
"""
import pytest
from unittest.mock import MagicMock, patch, call
import worker


# ── Tests: process_message ────────────────────────────────────────────────

def test_process_message_runs_without_error():
    """process_message should handle a message without raising."""
    message = {
        "MessageId": "abc-123",
        "Body": '{"market_id": 1, "side": "YES", "amount": 50}',
        "ReceiptHandle": "handle-abc",
    }
    # Should not raise
    worker.process_message(message)


def test_process_message_accepts_empty_dict():
    """process_message should not crash on an empty message."""
    worker.process_message({})


# ── Tests: main loop ──────────────────────────────────────────────────────

@patch("worker.boto3.client")
@patch("worker.time.sleep", side_effect=StopIteration)  # stops infinite loop after 1 iteration
def test_main_polls_sqs(mock_sleep, mock_boto):
    """main() should call receive_message on the SQS queue."""
    mock_sqs = MagicMock()
    mock_boto.return_value = mock_sqs
    mock_sqs.receive_message.return_value = {"Messages": []}

    with pytest.raises(StopIteration):
        worker.main()

    mock_sqs.receive_message.assert_called_once()


@patch("worker.boto3.client")
@patch("worker.time.sleep", side_effect=StopIteration)
def test_main_deletes_message_after_processing(mock_sleep, mock_boto):
    """main() should delete a message from SQS after processing it."""
    mock_sqs = MagicMock()
    mock_boto.return_value = mock_sqs
    mock_sqs.receive_message.return_value = {
        "Messages": [{
            "MessageId": "abc-123",
            "Body": '{"market_id": 1}',
            "ReceiptHandle": "handle-abc",
        }]
    }

    with pytest.raises(StopIteration):
        worker.main()

    mock_sqs.delete_message.assert_called_once_with(
        QueueUrl=worker.QUEUE_URL,
        ReceiptHandle="handle-abc",
    )


@patch("worker.boto3.client")
@patch("worker.time.sleep", side_effect=StopIteration)
def test_main_handles_empty_queue(mock_sleep, mock_boto):
    """main() should not crash when SQS returns no messages."""
    mock_sqs = MagicMock()
    mock_boto.return_value = mock_sqs
    mock_sqs.receive_message.return_value = {}  # no "Messages" key

    with pytest.raises(StopIteration):
        worker.main()

    mock_sqs.delete_message.assert_not_called()
