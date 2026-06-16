# BetOps — Friends Betting Platform

A Polymarket-style prediction market for friend groups.

## Stack
- **AWS**: API Gateway, Lambda (Python), RDS Postgres, SQS, Secrets Manager
- **Homelab**: Proxmox + k3s, Python worker (odds/settlement engine)
- **Connectivity**: Tailscale (homelab ↔ AWS VPC)
- **IaC**: Terraform
- **CI/CD**: GitHub Actions

## Repo Structure
```
betops/
├── terraform/
│   ├── modules/        # vpc, rds, lambda, sqs, tailscale, api-gateway
│   └── envs/           # dev / prod environments
├── lambdas/api/        # Python Lambda — serves UI and handles bets
├── worker/             # Homelab worker — polls SQS, calculates odds, settles markets
├── scripts/            # Init scripts (LocalStack setup, etc.)
└── .github/workflows/  # CI/CD pipelines
```

## Local Development

### Prerequisites
- Docker + Docker Compose
- Python 3.12

### Start the local stack

```bash
cp .env.example .env
make local
```

This starts:
- **PostgreSQL** on `localhost:5432`
- **LocalStack** (fake SQS) on `localhost:4566` — queues are created automatically

### Run the worker locally

```bash
cd worker
source ../.env   # or set env vars manually
pip install -r requirements-dev.txt
python worker.py
```

### Run tests

```bash
make test          # all tests
make test-lambda   # Lambda only
make test-worker   # worker only
```

### Stop the stack

```bash
make local-down
```
