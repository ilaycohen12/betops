# ─── RANDOM PASSWORD ───────────────────────────────────────────────────────
# Generate a secure random password for the database
resource "random_password" "db" {
  length           = 32
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

# ─── SECRETS MANAGER ───────────────────────────────────────────────────────
# Store the DB credentials securely — Lambda reads them at runtime
# Never hardcode passwords in Terraform files
resource "aws_secretsmanager_secret" "db" {
  name                    = "${var.project}/db-credentials"
  recovery_window_in_days = 0 # Allow immediate deletion (useful in dev)

  tags = { Name = "${var.project}-db-credentials" }
}

resource "aws_secretsmanager_secret_version" "db" {
  secret_id = aws_secretsmanager_secret.db.id
  secret_string = jsonencode({
    username = var.db_username
    password = random_password.db.result
    host     = aws_db_instance.main.address
    port     = 5432
    dbname   = var.db_name
  })
}

# ─── SUBNET GROUP ──────────────────────────────────────────────────────────
# RDS requires a subnet group — tells it which subnets it can use
# We give it both private subnets (across 2 AZs) for high availability
resource "aws_db_subnet_group" "main" {
  name       = "${var.project}-db-subnet-group"
  subnet_ids = var.private_subnet_ids

  tags = { Name = "${var.project}-db-subnet-group" }
}

# ─── RDS INSTANCE ──────────────────────────────────────────────────────────
resource "aws_db_instance" "main" {
  identifier        = "${var.project}-postgres"
  engine            = "postgres"
  engine_version    = "15"
  instance_class    = var.db_instance_class
  allocated_storage = 20 # GB — minimum for Postgres

  db_name  = var.db_name
  username = var.db_username
  password = random_password.db.result

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [var.rds_sg_id]

  # Backups — configurable per environment (0 = disabled, useful in dev)
  backup_retention_period = var.backup_retention
  backup_window           = "03:00-04:00" # 3-4am UTC

  # Maintenance window — apply patches on Sunday nights
  maintenance_window = "sun:04:00-sun:05:00"

  # Don't create a public IP — RDS stays private inside the VPC
  publicly_accessible = false

  # Encrypt data at rest
  storage_encrypted = true

  # Prevent accidental deletion via Terraform
  deletion_protection = false # Keep false for now so we can destroy easily

  # Skip final snapshot when destroying (useful during development)
  skip_final_snapshot = true

  tags = { Name = "${var.project}-postgres" }
}
