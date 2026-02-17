@Library('jenkinsLibrary@master') _

def scmVars
String DD_VERSION = ""

pipeline {
    agent any

    environment {
        GIT_COMMIT = ''
        APP_NAME = 'mycare-pricing-app'
    }

    parameters {
        string(name: 'BRANCH', defaultValue: 'master', description: 'Git branch to build')
        choice(name: 'ENVIRONMENT', choices: ['staging', 'production'], description: 'Deployment environment')
    }

    stages {
        stage('Clone repository') {
            steps {
                script {
                    echo "Building ${APP_NAME}..."
                    scmVars = git branch: params.BRANCH,
                        url: env.PROJECT_REPOSITORY,
                        credentialsId: env.BB_CREDENTIALS

                    GIT_COMMIT = scmVars.GIT_COMMIT
                    DD_VERSION = "${params.BRANCH}-${scmVars.GIT_COMMIT.substring(0, 16)}"

                    currentBuild.displayName = "#${env.BUILD_NUMBER} ${params.BRANCH} (${params.ENVIRONMENT})"
                }
            }
        }

        stage('Create .env') {
            steps {
                script {
                    // Collect environment-specific variables
                    def envVars = env.getEnvironment().findAll { key, value ->
                        key.startsWith('MYCARE_') || key.startsWith('VITE_') || key.startsWith('STRIPE_')
                    }

                    def envFileContent = envVars.collect { key, value ->
                        "${key}=${value}"
                    }.join("\n")

                    writeFile file: '.env', text: envFileContent
                    echo "Created .env file with ${envVars.size()} variables"
                }
            }
        }

        stage('Docker build') {
            steps {
                script {
                    dockerBuild([
                        dockerRepository: "${env.AWS_ECR_REPOSITORY}/${env.AWS_ECR_IMAGE_NAME}",
                        imageTag: "${GIT_COMMIT}",
                        buildArgs: [
                            LAST_COMMIT_HASH: GIT_COMMIT,
                            DD_VERSION: DD_VERSION,
                            NODE_ENV: 'production',
                            VITE_STRIPE_PUBLISHABLE_KEY: env.VITE_STRIPE_PUBLISHABLE_KEY,
                            VITE_API_URL: env.VITE_API_URL ?: ''
                        ]
                    ])
                }
            }
        }

        stage('Security Scan') {
            steps {
                script {
                    trivyScan([
                        dockerRepository: "${env.AWS_ECR_REPOSITORY}/${env.AWS_ECR_IMAGE_NAME}",
                        dockerTag: "${GIT_COMMIT}",
                        failOnVulnerabilities: false
                    ])
                }
            }
        }

        stage('Docker tag and push') {
            steps {
                withAWS(credentials: env.AWS_CREDENTIALS) {
                    script {
                        dockerPush([
                            region: env.AWS_REGION ?: 'us-east-2',
                            dockerRepository: "${env.AWS_ECR_REPOSITORY}/${env.AWS_ECR_IMAGE_NAME}",
                            imageTag: GIT_COMMIT,
                        ])
                    }
                }
            }
        }

        stage('ECS Deploy') {
            steps {
                script {
                    withAWS(credentials: env.AWS_CREDENTIALS) {
                        awsEcsDeploy([
                            region: env.AWS_REGION ?: 'us-east-2',
                            imageTag: GIT_COMMIT,
                            dockerRepository: "${env.AWS_ECR_REPOSITORY}/${env.AWS_ECR_IMAGE_NAME}",
                            clusterName: env.AWS_ECS_CLUSTER_NAME,
                            taskDefinitionName: env.AWS_TASK_DEFINITION,
                            serviceName: env.AWS_ECS_SERVICE_NAME,
                            waitDeploy: true
                        ])
                    }
                }
            }
        }

        stage('CloudFront Invalidation') {
            when {
                expression { env.AWS_CLOUDFRONT_DISTRIBUTION_ID?.trim() }
            }
            steps {
                withAWS(credentials: env.AWS_CREDENTIALS) {
                    awsCreateInvalidation([
                        distributionId: env.AWS_CLOUDFRONT_DISTRIBUTION_ID,
                    ])
                }
            }
        }

        stage('Cleaning') {
            steps {
                cleanWs()
            }
        }
    }

    post {
        success {
            script {
                echo "Deployment successful!"
                // Optionally send notifications
                if (env.SLACK_WEBHOOK_URL) {
                    slackSend(
                        color: 'good',
                        message: "✅ ${APP_NAME} deployed to ${params.ENVIRONMENT}\nBranch: ${params.BRANCH}\nCommit: ${GIT_COMMIT.substring(0, 8)}"
                    )
                }
            }
        }
        failure {
            script {
                echo "Deployment failed!"
                if (env.SLACK_WEBHOOK_URL) {
                    slackSend(
                        color: 'danger',
                        message: "❌ ${APP_NAME} deployment failed\nBranch: ${params.BRANCH}\nBuild: ${env.BUILD_URL}"
                    )
                }
            }
        }
    }
}
