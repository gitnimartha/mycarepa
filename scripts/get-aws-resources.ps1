# My Care Pricing App - AWS Resource Discovery Script (PowerShell)
# Usage: .\get-aws-resources.ps1 -Region us-east-2

param(
    [string]$Region = "us-east-2"
)

$ErrorActionPreference = "Stop"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "AWS Resource Discovery for My Care Pricing App" -ForegroundColor Cyan
Write-Host "Region: $Region" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Check AWS CLI
try {
    $identity = aws sts get-caller-identity --output json | ConvertFrom-Json
    $AccountId = $identity.Account
    Write-Host "AWS Account: $AccountId" -ForegroundColor Green
} catch {
    Write-Host "Error: AWS CLI not configured. Run 'aws configure' first." -ForegroundColor Red
    exit 1
}

Write-Host ""

# Get VPCs
Write-Host "=== VPCs ===" -ForegroundColor Yellow
$vpcs = aws ec2 describe-vpcs --region $Region --output json | ConvertFrom-Json
$vpcs.Vpcs | ForEach-Object {
    $name = ($_.Tags | Where-Object { $_.Key -eq "Name" }).Value
    if (-not $name) { $name = "(no name)" }
    Write-Host "  $($_.VpcId)  $($_.CidrBlock)  $name"
}

Write-Host ""
$VpcId = Read-Host "Enter VPC ID to use (e.g., vpc-0abc123)"

if (-not $VpcId) {
    Write-Host "No VPC selected. Exiting." -ForegroundColor Red
    exit 1
}

# Get Subnets
Write-Host ""
Write-Host "=== Subnets in $VpcId ===" -ForegroundColor Yellow
$subnets = aws ec2 describe-subnets --region $Region --filters "Name=vpc-id,Values=$VpcId" --output json | ConvertFrom-Json
$subnets.Subnets | ForEach-Object {
    $name = ($_.Tags | Where-Object { $_.Key -eq "Name" }).Value
    if (-not $name) { $name = "(no name)" }
    Write-Host "  $($_.SubnetId)  $($_.AvailabilityZone)  $($_.CidrBlock)  $name"
}

Write-Host ""
$SubnetInput = Read-Host "Enter Subnet IDs (comma-separated, e.g., subnet-abc123,subnet-def456)"
$SubnetIds = $SubnetInput -split "," | ForEach-Object { $_.Trim() }

if ($SubnetIds.Count -lt 1) {
    Write-Host "No subnets selected. Exiting." -ForegroundColor Red
    exit 1
}

# Get Security Groups
Write-Host ""
Write-Host "=== Security Groups in $VpcId ===" -ForegroundColor Yellow
$sgs = aws ec2 describe-security-groups --region $Region --filters "Name=vpc-id,Values=$VpcId" --output json | ConvertFrom-Json
$sgs.SecurityGroups | ForEach-Object {
    Write-Host "  $($_.GroupId)  $($_.GroupName)"
}

Write-Host ""
$SgInput = Read-Host "Enter Security Group ID (e.g., sg-0abc123) or 'new' to create one"

if ($SgInput -eq "new") {
    Write-Host "Creating new security group..." -ForegroundColor Yellow
    $SgId = aws ec2 create-security-group `
        --region $Region `
        --group-name "mycare-pricing-app-sg" `
        --description "Security group for My Care Pricing App" `
        --vpc-id $VpcId `
        --query 'GroupId' `
        --output text

    # Allow port 3001
    aws ec2 authorize-security-group-ingress --region $Region --group-id $SgId --protocol tcp --port 3001 --cidr 0.0.0.0/0
    # Allow port 443
    aws ec2 authorize-security-group-ingress --region $Region --group-id $SgId --protocol tcp --port 443 --cidr 0.0.0.0/0

    Write-Host "Created security group: $SgId" -ForegroundColor Green
} else {
    $SgId = $SgInput
}

# Generate YAML
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Generating configuration..." -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

$SubnetYaml = ($SubnetIds | ForEach-Object { "      - `"$_`"" }) -join "`n"

$OutputDir = "terraform"
if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir | Out-Null
}

$Config = @"
# My Care Pricing App - Terraform Configuration
# Generated on $(Get-Date)
# Region: $Region
# Account: $AccountId
#
# Copy this file to: lm-devops-configs/terraform/envs/{environment}/mycare-pricing-app.yaml

mycare-pricing-app:
  envvars:
    TG_WORKSPACE: "mycare-pricing-app"
    AWS_REGION: "$Region"

  tfvars-json:
    # Application Settings
    app_name: "mycare-pricing-app"
    environment: "staging"

    # ECS Configuration
    ecs_cluster_name: "mycare-cluster"
    ecs_service_name: "mycare-pricing-service"
    ecs_desired_count: 1
    ecs_min_capacity: 1
    ecs_max_capacity: 3

    # Task Definition
    task_cpu: 256
    task_memory: 512
    container_port: 3001

    # ECR Repository
    ecr_repository_name: "mycare-pricing-app"

    # Networking
    vpc_id: "$VpcId"
    subnet_ids:
$SubnetYaml
    security_group_ids:
      - "$SgId"

    # Load Balancer
    alb_enabled: true
    alb_name: "mycare-pricing-alb"
    alb_listener_port: 443
    health_check_path: "/api/health"
    # alb_certificate_arn: "arn:aws:acm:${Region}:${AccountId}:certificate/xxxxxxxx"

    # CloudWatch Logs
    log_group_name: "/ecs/mycare-pricing-app"
    log_retention_days: 30

    # Auto Scaling
    autoscaling_enabled: true
    autoscaling_cpu_target: 70

    # Tags
    tags:
      Project: "MyCare"
      Service: "PricingApp"
      ManagedBy: "Terraform"
"@

$OutputFile = "$OutputDir\mycare-pricing-app.yaml"
$Config | Out-File -FilePath $OutputFile -Encoding utf8

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "Configuration saved to: $OutputFile" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Summary:" -ForegroundColor Yellow
Write-Host "  VPC:             $VpcId"
Write-Host "  Subnets:         $($SubnetIds -join ', ')"
Write-Host "  Security Group:  $SgId"
Write-Host "  Region:          $Region"
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Review $OutputFile"
Write-Host "  2. Add SSL certificate ARN (if using HTTPS)"
Write-Host "  3. Copy to lm-devops-configs/terraform/envs/staging/"
Write-Host "  4. Run Jenkinsfile.infrastructure with TF_COMMAND=PLAN"
Write-Host "  5. Run Jenkinsfile.infrastructure with TF_COMMAND=APPLY"
Write-Host ""
