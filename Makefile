.PHONY: local local-down test test-lambda test-worker

local:
	docker compose up -d
	@echo "Stack is up. Postgres on :5432, LocalStack on :4566"

local-down:
	docker compose down -v

test-lambda:
	pip install -q -r lambdas/api/requirements-dev.txt
	pytest lambdas/api/ -v

test-worker:
	pip install -q -r worker/requirements-dev.txt
	pytest worker/ -v

test: test-lambda test-worker
