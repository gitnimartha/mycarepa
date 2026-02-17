#!/bin/bash
# My Care Pricing App - AWS Resource Discovery Script
# This script fetches VPC, Subnet, and Security Group IDs from AWS
#
# Usage: ./get-aws-resources.sh [region]
# Example: ./get-aws-resources.sh us-east-2

set -e

REGION=${1:-us-east-2}
OUTPUT_FILE="terraform/mycare-pricing-app.yaml"

echo "============================================"
echo "AWS Resource Discovery for My Care Pricing App"
echo "Region: $REGION"
echo "============================================"
echo ""

# Check AWS CLI is installed and configured
if ! command -v aws &> /dev/null; then
    echo "Error: AWS CLI is not installed"
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo "Error: AWS credentials not configured. Run 'aws configure' first."
    exit 1
fi

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "AWS Account: $ACCOUNT_ID"
echo ""

# Get VPCs
echo "=== VPCs ==="
aws ec2 describe-vpcs \
    --region $REGION \
    --query "Vpcs[*].[VpcId,CidrBlock,Tags[?Key=='Name'].Value|[0]||'(no name)']" \
    --output table

echo ""
read -p "Enter VPC ID to use (e.g., vpc-0abc123): " VPC_ID

if [ -z "$VPC_ID" ]; then
    echo "No VPC selected. Exiting."
    exit 1
fi

# Get Subnets for selected VPC
echo ""
echo "=== Subnets in $VPC_ID ==="
aws ec2 describe-subnets \
    --region $REGION \
    --filters "Name=vpc-id,Values=$VPC_ID" \
    --query "Subnets[*].[SubnetId,AvailabilityZone,CidrBlock,Tags[?Key=='Name'].Value|[0]||'(no name)']" \
    --output table

echo ""
echo "Enter Subnet IDs (comma-separated, at least 2 for high availability)"
read -p "e.g., subnet-abc123,subnet-def456: " SUBNET_INPUT

IFS=',' read -ra SUBNET_IDS <<< "$SUBNET_INPUT"

if [ ${#SUBNET_IDS[@]} -lt 1 ]; then
    echo "No subnets selected. Exiting."
    exit 1
fi

# Get Security Groups for selected VPC
echo ""
echo "=== Security Groups in $VPC_ID ==="
aws ec2 describe-security-groups \
    --region $REGION \
    --filters "Name=vpc-id,Values=$VPC_ID" \
    --query "SecurityGroups[*].[GroupId,GroupName,Description]" \
    --output table

echo ""
read -p "Enter Security Group ID (e.g., sg-0abc123) or 'new' to create one: " SG_INPUT

if [ "$SG_INPUT" == "new" ]; then
    echo "Creating new security group for My Care Pricing App..."
    SG_ID=$(aws ec2 create-security-group \
        --region $REGION \
        --group-name "mycare-pricing-app-sg" \
        --description "Security group for My Care Pricing App" \
        --vpc-id $VPC_ID \
        --query 'GroupId' \
        --output text)

    # Allow inbound on port 3001
    aws ec2 authorize-security-group-ingress \
        --region $REGION \
        --group-id $SG_ID \
        --protocol tcp \
        --port 3001 \
        --cidr 0.0.0.0/0

    # Allow inbound on port 443 (HTTPS)
    aws ec2 authorize-security-group-ingress \
        --region $REGION \
        --group-id $SG_ID \
        --protocol tcp \
        --port 443 \
        --cidr 0.0.0.0/0

    echo "Created security group: $SG_ID"
else
    SG_ID=$SG_INPUT
fi

# Generate YAML config
echo ""
echo "============================================"
echo "Generating configuration..."
echo "============================================"

# Build subnet list for YAML
SUBNET_YAML=""
for subnet in "${SUBNET_IDS[@]}"; do
    subnet=$(echo "$subnet" | xargs)  # trim whitespace
    SUBNET_YAML="$SUBNET_YAML      - \"$subnet\"\n"
done

mkdir -p terraform

cat > $OUTPUT_FILE << EOF
# My Care Pricing App - Terraform Configuration
# Generated on $(date)
# Region: $REGION
# Account: $ACCOUNT_ID
#
# Copy this file to: lm-devops-configs/terraform/envs/{environment}/mycare-pricing-app.yaml

mycare-pricing-app:
  envvars:
    TG_WORKSPACE: "mycare-pricing-app"
    AWS_REGION: "$REGION"

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
    vpc_id: "$VPC_ID"
    subnet_ids:
$(echo -e "$SUBNET_YAML")
    security_group_ids:
      - "$SG_ID"

    # Load Balancer
    alb_enabled: true
    alb_name: "mycare-pricing-alb"
    alb_listener_port: 443
    health_check_path: "/api/health"
    # alb_certificate_arn: "arn:aws:acm:$REGION:$ACCOUNT_ID:certificate/xxxxxxxx"

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
EOF

echo ""
echo "============================================"
echo "Configuration saved to: $OUTPUT_FILE"
echo "============================================"
echo ""
echo "Summary:"
echo "  VPC:             $VPC_ID"
echo "  Subnets:         ${SUBNET_IDS[*]}"
echo "  Security Group:  $SG_ID"
echo "  Region:          $REGION"
echo ""
echo "Next steps:"
echo "  1. Review $OUTPUT_FILE"
echo "  2. Add SSL certificate ARN (if using HTTPS)"
echo "  3. Copy to lm-devops-configs/terraform/envs/staging/"
echo "  4. Run Jenkinsfile.infrastructure with TF_COMMAND=PLAN"
echo "  5. Run Jenkinsfile.infrastructure with TF_COMMAND=APPLY"
echo ""
