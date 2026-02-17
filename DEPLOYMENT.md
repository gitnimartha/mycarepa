# My Care Personal Assistant - Deployment Guide

## Overview

This application is containerized using Docker and deployed to AWS ECS using Jenkins pipelines.
The deployment follows the same patterns used in the legalmatch infrastructure.

## Files Created

| File | Purpose |
|------|---------|
| `Dockerfile` | Multi-stage Docker build (builder + production) |
| `docker-entrypoint.sh` | Container startup script |
| `ecosystem.config.cjs` | PM2 configuration for clustering |
| `Jenkinsfile` | Application deployment pipeline |
| `Jenkinsfile.infrastructure` | Infrastructure provisioning pipeline (Terraform) |
| `buildspec.yml` | AWS CodeBuild specification |
| `Dockerrun.aws.json.example` | Elastic Beanstalk configuration |
| `.dockerignore` | Files to exclude from Docker build |
| `docker-compose.yml` | Local development/testing |
| `ecs-task-definition.json` | AWS ECS task definition template |
| `jenkins.env.template` | Jenkins environment variables template |
| `terraform/mycare-pricing-app.yaml.example` | Terraform config for lm-devops-configs |

## Two-Stage Deployment

### Stage 1: Infrastructure (One-time / When changes needed)

Use `Jenkinsfile.infrastructure` to provision AWS resources:

```
Jenkins Job: MyCare-Pricing-Infrastructure
Parameters:
  - BRANCH: master
  - TF_COMMAND: PLAN  (first run PLAN, then APPLY)
  - ENVIRONMENT: staging
```

This creates:
- ECR Repository
- ECS Cluster & Service
- Application Load Balancer
- Security Groups
- CloudWatch Log Groups
- Secrets Manager entries

### Stage 2: Application Deployment (Ongoing)

Use `Jenkinsfile` for regular deployments:

```
Jenkins Job: MyCare-Pricing-Deploy
Parameters:
  - BRANCH: master
  - ENVIRONMENT: staging
```

This:
- Builds Docker image
- Pushes to ECR
- Updates ECS service

---

## Local Docker Build

```bash
# Build the image
docker build -t mycare-pricing-app:latest \
  --build-arg VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx \
  .

# Run locally
docker run -p 3001:3001 \
  -e STRIPE_SECRET_KEY=sk_test_xxx \
  -e MYCARE_METER_ID=mtr_xxx \
  -e MYCARE_PRICE_TRIAL=price_xxx \
  -e MYCARE_PRICE_STARTER_BASE=price_xxx \
  -e MYCARE_PRICE_STARTER_HOURLY=price_xxx \
  -e MYCARE_PRICE_PLUS_BASE=price_xxx \
  -e MYCARE_PRICE_PLUS_HOURLY=price_xxx \
  -e MYCARE_PRICE_PRO_BASE=price_xxx \
  -e MYCARE_PRICE_PRO_HOURLY=price_xxx \
  mycare-pricing-app:latest
```

## Docker Compose

```bash
# Production build and run
docker-compose up --build

# Development mode (with hot reload)
docker-compose --profile dev up
```

## Terraform Configuration (lm-devops-configs)

Copy `terraform/mycare-pricing-app.yaml.example` to the devops-configs repo:

```bash
# In lm-devops-configs repo
cp mycare-pricing-app.yaml.example terraform/envs/staging/mycare-pricing-app.yaml
cp mycare-pricing-app.yaml.example terraform/envs/production/mycare-pricing-app.yaml
```

Update the YAML files with your actual AWS resource IDs (VPC, subnets, etc.).

---

## Jenkins Pipeline Setup

### 1. Create Jenkins Jobs

Create TWO Jenkins jobs:

**Job 1: Infrastructure (Jenkinsfile.infrastructure)**
- Name: `MyCare-Pricing-Infrastructure`
- Pipeline from SCM → Script Path: `Jenkinsfile.infrastructure`
- Run this FIRST with TF_COMMAND=PLAN, then APPLY

**Job 2: Application (Jenkinsfile)**
- Name: `MyCare-Pricing-Deploy`
- Pipeline from SCM → Script Path: `Jenkinsfile`
- Run this for regular deployments

### 2. Create Application Job

1. Create a new Pipeline job in Jenkins
2. Configure Pipeline from SCM (Git)
3. Set Script Path to `Jenkinsfile`

### 2. Configure Environment Variables

Add these environment variables to your Jenkins job configuration:

**Repository:**
- `PROJECT_REPOSITORY` - Git repository URL
- `BB_CREDENTIALS` - Bitbucket credentials ID

**AWS:**
- `AWS_CREDENTIALS` - AWS credentials ID
- `AWS_REGION` - AWS region (e.g., us-east-2)
- `AWS_ECR_REPOSITORY` - ECR repository URL
- `AWS_ECR_IMAGE_NAME` - Image name (mycare-pricing-app)
- `AWS_ECS_CLUSTER_NAME` - ECS cluster name
- `AWS_ECS_SERVICE_NAME` - ECS service name
- `AWS_TASK_DEFINITION` - Task definition name
- `AWS_CLOUDFRONT_DISTRIBUTION_ID` - (Optional) CloudFront distribution

**Stripe (use Jenkins credentials):**
- `VITE_STRIPE_PUBLISHABLE_KEY` - Publishable key
- `STRIPE_SECRET_KEY` - Secret key (as credential)
- `STRIPE_WEBHOOK_SECRET` - Webhook secret (as credential)

**My Care Billing:**
- `MYCARE_METER_ID`
- `MYCARE_METER_EVENT_NAME`
- `MYCARE_PRICE_*` - All price IDs

### 3. Required Jenkins Plugins

- Git plugin
- Pipeline plugin
- AWS Steps plugin
- Docker Pipeline plugin
- Credentials plugin

### 4. Required Jenkins Shared Library

The pipeline uses `@Library('jenkinsLibrary@master')` with these functions:
- `gitCheckout()` - Git operations
- `dockerBuild()` - Docker image building
- `dockerPush()` - Push to ECR
- `trivyScan()` - Security scanning
- `awsEcsDeploy()` - ECS deployment
- `awsCreateInvalidation()` - CloudFront cache invalidation

## AWS ECS Setup

### 1. Create ECR Repository

```bash
aws ecr create-repository \
  --repository-name mycare-pricing-app \
  --region us-east-2
```

### 2. Create ECS Cluster

```bash
aws ecs create-cluster \
  --cluster-name mycare-cluster \
  --region us-east-2
```

### 3. Register Task Definition

Update `ecs-task-definition.json` with your AWS account ID and register:

```bash
aws ecs register-task-definition \
  --cli-input-json file://ecs-task-definition.json \
  --region us-east-2
```

### 4. Create ECS Service

```bash
aws ecs create-service \
  --cluster mycare-cluster \
  --service-name mycare-pricing-service \
  --task-definition mycare-pricing-app \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}" \
  --region us-east-2
```

### 5. Store Secrets in AWS Secrets Manager

```bash
# Store Stripe secrets
aws secretsmanager create-secret \
  --name mycare/stripe-secret-key \
  --secret-string "sk_live_xxx"

aws secretsmanager create-secret \
  --name mycare/stripe-webhook-secret \
  --secret-string "whsec_xxx"
```

## Pipeline Stages

1. **Clone repository** - Checkout code from Git
2. **Create .env** - Generate environment file from Jenkins vars
3. **Docker build** - Build multi-stage Docker image
4. **Security Scan** - Run Trivy vulnerability scan
5. **Docker tag and push** - Push to AWS ECR
6. **ECS Deploy** - Update ECS service with new image
7. **CloudFront Invalidation** - Clear CDN cache (if configured)
8. **Cleaning** - Cleanup workspace

## Health Checks

The application exposes a health endpoint:

```
GET /api/health
Response: { "status": "healthy", "timestamp": "2025-02-17T12:00:00.000Z" }
```

## Monitoring

- AWS CloudWatch Logs: `/ecs/mycare-pricing-app`
- Container health checks every 30 seconds
- ECS service auto-recovery on failure
