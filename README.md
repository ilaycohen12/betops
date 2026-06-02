# BetOps — Friends Betting Platform

Infrastructure for a Polymarket-style betting platform for friends.

## Stack
- **AWS**: API Gateway, Lambda (Python), RDS Postgres, SQS, Secrets Manager
- **Homelab**: Proxmox cluster, Python worker (odds/settlement engine)
- **Connectivity**: WireGuard VPN tunnel (homelab ↔ AWS VPC)
- **IaC**: Terraform
- **CI/CD**: GitHub Actions

## Repo Structure
```
betops/
├── terraform/
│   ├── modules/        # Reusable modules (vpc, rds, lambda, sqs)
│   └── envs/prod/      # Production environment
├── lambdas/api/        # Python Lambda handler
├── worker/             # Homelab Python worker (SQS consumer)
└── .github/workflows/  # CI/CD pipelines
```

## Roadmap
1. Foundation & repo setup ✅
2. CI/CD pipeline (GitHub Actions)
3. Core AWS infrastructure
4. Homelab integration
5. Hardening & launch
