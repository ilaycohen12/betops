def lambda_handler(event, context):
    html = """
<!DOCTYPE html>
<html>
<head><title>BetOps</title></head>
<body>
  <h1>Welcome to BetOps 🎲</h1>
  <p>Your friends betting platform is coming soon.</p>
</body>
</html>
"""
    return {
        "statusCode": 200,
        "headers": {"Content-Type": "text/html"},
        "body": html,
    }
