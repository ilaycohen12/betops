"""
Tests for the Lambda API handler.
"""
import pytest
from handler import lambda_handler


# ── Fixtures ──────────────────────────────────────────────────────────────

@pytest.fixture
def apigw_event():
    """Minimal API Gateway v2 event."""
    return {
        "version": "2.0",
        "routeKey": "GET /",
        "rawPath": "/",
        "rawQueryString": "",
        "headers": {"host": "example.execute-api.us-east-1.amazonaws.com"},
        "requestContext": {
            "http": {"method": "GET", "path": "/"},
            "stage": "$default",
        },
        "isBase64Encoded": False,
    }


@pytest.fixture
def context():
    """Mock Lambda context object."""
    class MockContext:
        function_name = "betops-api"
        memory_limit_in_mb = 128
        invoked_function_arn = "arn:aws:lambda:us-east-1:123456789:function:betops-api"
        aws_request_id = "test-request-id"
    return MockContext()


# ── Tests ─────────────────────────────────────────────────────────────────

def test_returns_200(apigw_event, context):
    response = lambda_handler(apigw_event, context)
    assert response["statusCode"] == 200


def test_returns_html_content_type(apigw_event, context):
    response = lambda_handler(apigw_event, context)
    assert response["headers"]["Content-Type"] == "text/html"


def test_body_is_string(apigw_event, context):
    response = lambda_handler(apigw_event, context)
    assert isinstance(response["body"], str)


def test_body_contains_betops(apigw_event, context):
    response = lambda_handler(apigw_event, context)
    assert "BetOps" in response["body"]


def test_body_is_valid_html(apigw_event, context):
    response = lambda_handler(apigw_event, context)
    body = response["body"]
    assert body.strip().startswith("<!DOCTYPE html>")
    assert "</html>" in body


def test_response_has_required_keys(apigw_event, context):
    response = lambda_handler(apigw_event, context)
    assert "statusCode" in response
    assert "headers" in response
    assert "body" in response
