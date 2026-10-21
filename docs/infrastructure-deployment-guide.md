# Infrastructure & Deployment Guide

This document covers infrastructure setup, AWS EC2 provisioning, security groups, Docker configuration, GitHub Actions self-hosted runner installation, and environment management for the **Kafka Express E-Commerce Platform**.

---

## Table of Contents
1. [EC2 Instance Provisioning](#1-ec2-instance-provisioning)
2. [AWS Security Group Configuration](#2-aws-security-group-configuration)
3. [Server Preparation (Docker & Utilities)](#3-server-preparation-docker--utilities)
4. [GitHub Actions Self-Hosted Runner Setup](#4-github-actions-self-hosted-runner-setup)
5. [CI/CD Secrets & Production Environment (.env.prod)](#5-cicd-secrets--production-environment-envprod)
6. [Deployment Pipeline & Database Migrations](#6-deployment-pipeline--database-migrations)
7. [Observability & Maintenance Runbook](#7-observability--maintenance-runbook)

---

## 1. EC2 Instance Provisioning

### Recommended Specifications
- **Instance Type**: `t3.medium` (2 vCPU, 4 GiB RAM) minimum. For full multi-container production workloads with Elasticsearch and Kafka, consider setting up a **Swap file** (4 GB) to prevent OOM kills during heavy builds.
- **AMI**: Ubuntu 24.04 LTS (HVM), SSD Volume Type (`amd64`).
- **Storage**: Minimum 30 GB gp3 root volume.
- **Network**: Default VPC with public IPv4 assigned.

### SSH Access
Connect to your server:
```bash
ssh -i /path/to/your-key.pem ubuntu@<EC2_PUBLIC_IP>
```

---

## 2. AWS Security Group Configuration

The EC2 instance should be associated with a dedicated Security Group (e.g., `ecommerce-platform-sg`).

### Inbound Rules (Traffic Allowed into EC2)

| Type | Protocol | Port Range | Source | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **SSH** | TCP | `22` | `My IP` *(recommended)* | Secure administration |
| **HTTP** | TCP | `80` | `0.0.0.0/0` | React Frontend & Nginx reverse proxy |
| **HTTPS** | TCP | `443` | `0.0.0.0/0` | Secure SSL/TLS web traffic |
| **Grafana** | TCP | `3000` | `My IP` or `0.0.0.0/0` | Monitoring dashboards |
| **Prometheus** *(optional)* | TCP | `9090` | `My IP` | Metrics targets status UI |
| **Kafka UI** *(optional)* | TCP | `8080` | `My IP` | Kafka cluster inspector |

> [!CAUTION]
> **Never open internal database and broker ports to `0.0.0.0/0`!**
> Ports `5432` (PostgreSQL), `6432` (PgBouncer), `6379` (Redis), `9092` (Kafka), `2181` (Zookeeper), and `9200` (Elasticsearch) must only communicate within Docker's internal bridge network (`ecommerce-network`).

### Outbound Rules
- **All traffic** (`0.0.0.0/0`) — required to download Docker images, system updates, and communicate with GitHub.

---

## 3. Server Preparation (Docker & Utilities)

Run the following commands on the freshly launched EC2 instance:

```bash
# 1. Update packages
sudo apt update && sudo apt upgrade -y

# 2. Install essential tools
sudo apt install -y ca-certificates curl gnupg lsb-release git htop jq

# 3. Add Docker's official GPG key & repository
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 4. Install Docker Engine and Docker Compose Plugin
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 5. Enable and start Docker service
sudo systemctl enable --now docker

# 6. Allow the ubuntu user to run Docker without sudo
sudo usermod -aG docker ubuntu
newgrp docker

# 7. Configure 4GB Swap (vital for t3.medium during docker builds)
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## 4. GitHub Actions Self-Hosted Runner Setup

The deployment pipeline runs directly on the EC2 instance using a GitHub Actions runner registered as a system service.

### Step 1: Create Runner Directory
```bash
mkdir -p ~/actions-runner && cd ~/actions-runner
```

### Step 2: Download and Extract Runner
*(Check repository: **Settings → Actions → Runners → New self-hosted runner** for the latest download link and token)*:
```bash
curl -o actions-runner-linux-x64-2.322.0.tar.gz -L https://github.com/actions/runner/releases/download/v2.322.0/actions-runner-linux-x64-2.322.0.tar.gz
tar xzf ./actions-runner-linux-x64-2.322.0.tar.gz
```

### Step 3: Configure Runner
```bash
./config.sh --url https://github.com/kotenkodev/express-react-kafka-ecommerce --token <YOUR_RUNNER_REGISTRATION_TOKEN>
```
- Runner group: default
- Runner name: `ec2-t3-medium`
- Runner labels: `self-hosted,Linux,X64`
- Work folder: `_work`

### Step 4: Install and Start as a Systemd Service
```bash
sudo ./svc.sh install
sudo ./svc.sh start
sudo ./svc.sh status
```
The runner is now active and will automatically restart if the EC2 instance reboots.

---

## 5. CI/CD Secrets & Production Environment (`.env.prod`)

In your GitHub repository, navigate to **Settings → Secrets and variables → Actions** and add the repository secret:

### Secret Name: `ENV_FILE`

Paste your production environment variables (replacing `<EC2_PUBLIC_IP>` with your instance's elastic or public IP):

```env
# Node Environment
NODE_ENV=production
CORS_ORIGINS=http://<EC2_PUBLIC_IP>,http://localhost:5173
JWT_SECRET=super_secure_random_production_jwt_secret_key_32_chars
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
TRUST_PROXY=loopback,uniquelocal
METRICS_SCRAPE_TOKEN=metrics-secure-scrape-token-prod

# Rate Limiting
ENABLE_RATE_LIMIT=true
AUTH_RATE_LIMIT_PER_MINUTE=120
LOGIN_RATE_LIMIT_PER_MINUTE=30
LOGIN_FAILURE_LIMIT=10
REGISTER_RATE_LIMIT_PER_HOUR=5
REFRESH_RATE_LIMIT_PER_MINUTE=30

# PostgreSQL
POSTGRES_PORT=5432
POSTGRES_USER=admin
POSTGRES_PASSWORD=your_strong_postgres_password
POSTGRES_DB=kafkashop
DIRECT_URL=postgresql://admin:your_strong_postgres_password@postgres:5432/kafkashop?schema=public

# PgBouncer
PGBOUNCER_PORT=6432
PGBOUNCER_MAX_CLIENT_CONN=2000
PGBOUNCER_DEFAULT_POOL_SIZE=25
PGBOUNCER_MAX_DB_CONNECTIONS=50
DATABASE_URL=postgresql://admin:your_strong_postgres_password@pgbouncer:6432/kafkashop?schema=public&pgbouncer=true

# Redis
REDIS_PORT=6379
REDIS_URL=redis://redis:6379

# Elasticsearch
ELASTICSEARCH_PORT=9200
ELASTICSEARCH_URL=http://elasticsearch:9200
ELASTIC_PASSWORD=your_strong_elastic_password

# Kafka & Zookeeper
ZOOKEEPER_PORT=2181
KAFKA_PORT=9092
KAFKA_BROKERS=kafka:9092

# Monitoring
PROMETHEUS_PORT=9090
GRAFANA_PORT=3000
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=your_strong_grafana_password

# Gateway & Microservices
API_GATEWAY_PORT=8000
ORDER_SERVICE_PORT=3001
PAYMENT_SERVICE_PORT=3002
DELIVERY_SERVICE_PORT=3003
ANALYTICS_SERVICE_PORT=3004
SEARCH_SERVICE_PORT=3005
AUTH_SERVICE_PORT=3006
PRODUCT_SERVICE_PORT=3007

# Service URLs
AUTH_SERVICE_URL=http://auth-service:3006
PRODUCT_SERVICE_URL=http://product-service:3007
ORDER_SERVICE_URL=http://order-service:3001
SEARCH_SERVICE_URL=http://search-service:3005
ANALYTICS_SERVICE_URL=http://analytics-service:3004

# Frontend
FRONTEND_PORT=80
VITE_API_URL=http://<EC2_PUBLIC_IP>
```

---

## 6. Deployment Pipeline & Database Migrations

Deployments are triggered automatically on `git push origin main` via `.github/workflows/deploy.yml`.

### Pipeline Execution Steps:
1. **Checkout Code**: checks out the repository inside the runner work directory.
2. **Write `.env` file**: injects `${{ secrets.ENV_FILE }}` with `chmod 600`.
3. **Docker Compose Down**: `docker compose -f docker-compose.prod.yml down --remove-orphans`.
4. **Docker Compose Up & Build**: builds multi-stage production images and starts containers in detached mode.
5. **Database Migration**: runs `prisma migrate deploy` to safely apply any pending migrations.
6. **Database Seed**: executes idempotent catalog and admin seeding.

---

## 7. Observability & Maintenance Runbook

### Checking Container Health on EC2
```bash
# Check all running containers
docker compose -f docker-compose.prod.yml ps

# View live aggregated logs
docker compose -f docker-compose.prod.yml logs -f --tail=100

# View specific service logs
docker compose -f docker-compose.prod.yml logs -f product-service
docker compose -f docker-compose.prod.yml logs -f order-service
docker compose -f docker-compose.prod.yml logs -f search-service
```

### Inspecting Unhealthy Containers
If a container fails healthcheck:
```bash
docker inspect --format='{{range .State.Health.Log}}{{.Output}}{{end}}' <container_name>
```

### Manually Running Database Migrations
```bash
docker compose -f docker-compose.prod.yml exec -T product-service \
  npx prisma migrate deploy --schema=../../shared/prisma/schema.prisma
```

### Accessing Dashboards
- **Web App**: `http://<EC2_PUBLIC_IP>`
- **Grafana Dashboards**: `http://<EC2_PUBLIC_IP>:3000` (Default credentials configured in `.env`)
- **Prometheus Targets**: `http://<EC2_PUBLIC_IP>:9090/targets` (if port `9090` is opened)

