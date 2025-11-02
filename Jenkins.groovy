pipeline {
    agent any

    environment {
        NODE_VERSION = '20'
        API_DIR = 'api'
        DEPLOY_DIR = '/opt/svr'
        SERVICE_NAME = 'svr'
        GIT_CREDENTIALS_ID = 'git'
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'main',
                    credentialsId: "${GIT_CREDENTIALS_ID}",
                    url: 'https://github.com/GageYacano/Be4Real'
            }
        }

        stage('Install Node.js') {
            steps {
                sh '''
                if ! command -v node > /dev/null; then
                    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
                    sudo apt-get install -y nodejs
                fi
                '''
            }
        }

        stage('Install Dependencies') {
            steps {
                sh '''
                cd ${API_DIR}
                npm ci --omit=dev
                '''
            }
        }

        stage('Build API') {
            steps {
                sh '''
                cd ${API_DIR}
                npm run build
                '''
            }
        }

        stage('Deploy to Server') {
            steps {
                sh '''
                echo "Deploying API to ${DEPLOY_DIR}..."
                sudo rm -rf ${DEPLOY_DIR}/*
                sudo mkdir -p ${DEPLOY_DIR}
                sudo cp -r ${API_DIR}/dist ${DEPLOY_DIR}/
                sudo cp -r ${API_DIR}/package.json ${DEPLOY_DIR}/
                sudo cp -r ${API_DIR}/package-lock.json ${DEPLOY_DIR}/
                sudo cp -r ${API_DIR}/.env ${DEPLOY_DIR}/ || true
                '''
            }
        }

        stage('Install Dependencies and Restart Service') {
            steps {
                sh '''
                cd ${DEPLOY_DIR}
                sudo npm ci --omit=dev
                sudo systemctl daemon-reload
                sudo systemctl restart ${SERVICE_NAME}
                sudo systemctl status ${SERVICE_NAME} --no-pager -l | head -n 10
                '''
            }
        }
    }

    post {
        success {
            echo '✅ Deployment successful!'
        }
        failure {
            echo '❌ Deployment failed. Check Jenkins logs.'
        }
    }
}
