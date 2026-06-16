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

# --- SQS ---

module "sqs" {
  source  = "../../modules/sqs"
  project = var.project
  tags    = local.tags
}

# --- Lambda ---

module "lambda" {
  source = "../../modules/lambda"

  project       = var.project
  handler_path  = "${path.module}/../../../lambdas/api/handler.py"
  db_secret_arn = module.rds.db_secret_arn
  sqs_queue_arn = module.sqs.queue_arn
  sqs_queue_url = module.sqs.queue_url
  subnet_ids    = [module.vpc.private_subnet_id, module.vpc.private_subnet_b_id]
  lambda_sg_id  = module.vpc.lambda_sg_id
  jwt_secret    = var.jwt_secret
  tags          = local.tags
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
