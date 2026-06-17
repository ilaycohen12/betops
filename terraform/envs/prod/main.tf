terraform {
  required_version = ">= 1.6"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }

  backend "s3" {
    bucket = "betops-terraform-state"
    key    = "prod/terraform.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = var.aws_region
}

locals {
  tags = {
    project = var.project
    env     = "prod"
    managed = "terraform"
  }
}

# --- VPC ---

module "vpc" {
  source = "../../modules/vpc"

  project               = var.project
  aws_region            = var.aws_region
  vpc_cidr              = var.vpc_cidr
  public_subnet_cidr    = var.public_subnet_cidr
  private_subnet_cidr   = var.private_subnet_cidr
  private_subnet_b_cidr = var.private_subnet_b_cidr
}

# --- RDS ---

module "rds" {
  source = "../../modules/rds"

  project            = var.project
  private_subnet_ids = [module.vpc.private_subnet_id, module.vpc.private_subnet_b_id]
  rds_sg_id          = module.vpc.rds_sg_id
  backup_retention   = var.backup_retention
}

# --- Dev database on prod RDS ---
# betops_dev lives on the same RDS instance as betops (prod).
# The dev worker on the homelab connects to it via Tailscale.

resource "random_password" "dev_db" {
  length           = 32
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

resource "aws_secretsmanager_secret" "dev_db" {
  name                    = "betops/dev-db-credentials"
  recovery_window_in_days = 0
  tags                    = { Name = "betops-dev-db-credentials" }
}

resource "aws_secretsmanager_secret_version" "dev_db" {
  secret_id = aws_secretsmanager_secret.dev_db.id
  secret_string = jsonencode({
    username = "betops_dev"
    password = random_password.dev_db.result
    host     = module.rds.db_endpoint
    port     = 5432
    dbname   = "betops_dev"
  })
}

# Invokes the prod Lambda (which has RDS access) to CREATE DATABASE betops_dev.
# Runs once on first apply; re-runs if the dev secret is rotated.
# RDS takes ~8 minutes to create, so by the time this runs the Lambda
# will already have the updated code from deploy-lambda.yml.
resource "null_resource" "create_dev_db" {
  triggers = {
    secret_version = aws_secretsmanager_secret_version.dev_db.id
  }

  provisioner "local-exec" {
    command = <<-EOF
      aws lambda invoke \
        --function-name ${module.lambda.function_name} \
        --payload "{\"action\":\"create_dev_db\",\"dev_secret_arn\":\"${aws_secretsmanager_secret.dev_db.arn}\"}" \
        --cli-binary-format raw-in-base64-out \
        /tmp/create_dev_db_response.json
      python3 -c "import json,sys; r=json.load(open('/tmp/create_dev_db_response.json')); print(r); sys.exit(1 if r.get('status')=='error' else 0)"
    EOF
  }

  depends_on = [module.rds, module.lambda, aws_secretsmanager_secret_version.dev_db]
}

# --- SQS ---

module "sqs" {
  source  = "../../modules/sqs"
  project = var.project
  tags    = local.tags
}

# --- Lambda ---

module "lambda" {
  source = "../../modules/lambda"

  project           = var.project
  handler_path      = "${path.module}/../../../lambdas/api/handler.py"
  db_secret_arn     = module.rds.db_secret_arn
  extra_secret_arns = [aws_secretsmanager_secret.dev_db.arn]
  sqs_queue_arn     = module.sqs.queue_arn
  sqs_queue_url     = module.sqs.queue_url
  subnet_ids        = [module.vpc.private_subnet_id, module.vpc.private_subnet_b_id]
  lambda_sg_id      = module.vpc.lambda_sg_id
  jwt_secret        = var.jwt_secret
  tags              = local.tags
}

# --- API Gateway ---

module "api_gateway" {
  source = "../../modules/api-gateway"

  project              = var.project
  lambda_invoke_arn    = module.lambda.invoke_arn
  lambda_function_name = module.lambda.function_name
  tags                 = local.tags
}

# --- Frontend ---

module "frontend" {
  source  = "../../modules/frontend"
  project = var.project
  tags    = local.tags
}

# --- Tailscale ---

module "tailscale" {
  source = "../../modules/tailscale"

  project            = var.project
  vpc_id             = module.vpc.vpc_id
  public_subnet_id   = module.vpc.public_subnet_id
  advertise_routes   = "${var.private_subnet_cidr},${var.private_subnet_b_cidr}"
  tailscale_auth_key = var.tailscale_auth_key
  rds_sg_id          = module.vpc.rds_sg_id
  tags               = local.tags
}
