# BetOps — Project Overview

A Polymarket-style prediction market for friend groups.

---

## The Big Picture

```
                     ┌─────────────────────────────────────────┐
                     │                 AWS                      │
                     │                                          │
 User's browser ────▶│  API Gateway                            │
                     │      │                                   │
                     │      ▼                                   │
                     │   Lambda ──────────────────▶ SQS Queue  │
                     │      │                          │        │
                     │      ▼                          │        │
                     │     RDS (Postgres)              │        │
                     │                                 │        │
                     │   Tailscale EC2 ◀───────────────┘        │
                     └──────────┬──────────────────────────────┘
                                │ Tailscale VPN
                                ▼
                     ┌─────────────────────┐
                     │     Your Homelab     │
                     │   (Proxmox + k3s)   │
                     └─────────────────────┘
```

---

## 1. AWS Infrastructure (Terraform)

All AWS resources are defined as code in `terraform/modules/` — one folder per piece.

| Module | What it does |
|---|---|
| `vpc/` | The private network everything lives in. Lambda and RDS are hidden inside it. |
| `rds/` | The Postgres database. Credentials stored securely in Secrets Manager. |
| `lambda/` | The function that handles all API requests. |
| `api-gateway/` | The public URL that forwards browser requests to Lambda. |
| `sqs/` | The queue that passes bet events from Lambda to the homelab worker. |
| `tailscale/` | A small EC2 instance that bridges the AWS VPC to your homelab over VPN. |

There are two environments — **dev** (for testing) and **prod** (real users), each with their own copy of all the above. Defined in `terraform/envs/dev/` and `terraform/envs/prod/`.

---

## 2. CI/CD (GitHub Actions)

Every push to GitHub automatically runs the right pipeline. No manual deployments needed.

```
You push code to GitHub
        │
        ├── changed terraform/  ──▶ deploy.yml
        │                              │
        │                         1. Lint (check for mistakes)
        │                         2. Plan (show what will change in AWS)
        │                         3. Apply (make the changes)
        │
        ├── changed lambdas/    ──▶ deploy-lambda.yml + test.yml
        │                              │
        │                         1. Run tests
        │                         2. Bundle dependencies + handler into zip
        │                         3. Upload to AWS Lambda
        │
        └── changed worker/     ──▶ test.yml
                                       │
                                  1. Run worker tests
```

**Branch → Environment mapping:**
```
push to dev  ──▶ deploys to dev AWS environment
push to main ──▶ deploys to prod AWS environment
```

**Manual workflows** (run from GitHub Actions tab):
- `migrate.yml` — creates tables in the database (or seeds sample data)

---

## 3. Database Schema

4 tables in Postgres on RDS:

```
users                        markets
─────────────────────        ──────────────────────────────
id          (UUID)           id          (UUID)
email       (text)           question    ("Will X happen?")
name        (text)           yes_price   (0.54 = 54% chance YES)
balance     ($500 default)   status      (open/closed/settled)
created_at                   result      (yes/no — set when settled)
                             closes_at
                             created_by  ──▶ users


bets                         transactions
─────────────────────        ──────────────────────────────
id          (UUID)           id           (UUID)
user_id     ──▶ users        user_id      ──▶ users
market_id   ──▶ markets      amount       (+credit / -debit)
side        (yes/no)         type         (bet_placed/payout/deposit)
amount      ($)              reference_id (points to bet or market)
yes_price   (odds at time    created_at
             of placing bet)
created_at
```

---

## 4. Lambda API

The Lambda is the backend brain. It receives HTTP requests from API Gateway and handles all the logic.

```
GET  /health   ──▶ returns {"status": "ok"}

GET  /markets  ──▶ reads markets table
               ──▶ returns list of open markets with current odds

POST /bets     ──▶ validates the request (fields, side, amount)
               ──▶ checks user has enough balance
               ──▶ deducts balance from user
               ──▶ writes bet to bets table
               ──▶ writes transaction to transactions table
               ──▶ pushes message to SQS (triggers worker to recalculate odds)
               ──▶ returns the placed bet details
```

**How it connects to the database:**
```
Running locally?  ──▶ uses DB_HOST / DB_USER / DB_PASSWORD from .env
Running on AWS?   ──▶ reads credentials from Secrets Manager (secure, no hardcoding)
```

**File:** `lambdas/api/handler.py`

---

## 5. Local Development Environment

Lets you run the full stack on your own machine without touching AWS.

```
make local        starts Postgres (localhost:5432)
                  + LocalStack fake SQS (localhost:4566)

make db-migrate   creates the 4 tables locally

make db-seed      loads 3 sample users + 2 sample markets

make test         runs all tests (Lambda + worker)

make local-down   stops and cleans up everything
```

**Files:** `docker-compose.yml`, `.env.example`, `Makefile`, `scripts/init-localstack.sh`

---

## 6. Worker (in progress)

Runs on your homelab. Polls SQS for bet events placed by the Lambda.

```
Homelab worker
    │
    └── polls SQS every 20 seconds
            │
            ├── message arrives: "bet placed on market X"
            │
            ├── TODO: recalculate odds based on new bet
            ├── TODO: if market resolved, calculate payouts
            └── TODO: write results back to RDS
```

Currently receives messages but calculation logic is not implemented yet.

**File:** `worker/worker.py`

---

## Current Status

```
Browser ──▶ API Gateway ──▶ Lambda ──▶ RDS       ✅ working
                                   ──▶ SQS        ✅ messages sent
                                         │
                                      Worker       ⏳ skeleton only
                                         │
                                        RDS        ⏳ not written back yet

Frontend (what users actually see)                 ⏳ not built yet
Authentication (login / user identity)             ⏳ not built yet
Observability (logs, metrics, alerts)              ⏳ not built yet
```

---

## Roadmap

| # | Issue | Status |
|---|---|---|
| #8 | Local dev environment | ✅ Done |
| #9 | Database schema | ✅ Done |
| #10 | Lambda REST API | ✅ Done |
| #11 | Worker calculation logic | ⏳ Next |
| #12 | Containerize worker + deploy to k3s | ⏳ Pending |
| #13 | Frontend (React + CloudFront) | ⏳ Pending |
| #14 | Authentication (Cognito + Google) | ⏳ Pending |
| #15 | Observability | ⏳ Pending |
