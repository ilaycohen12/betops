import json


def lambda_handler(event, context):
    """Main API Lambda handler — placeholder."""
    return {
        "statusCode": 200,
        "body": json.dumps({"status": "ok"}),
    }
