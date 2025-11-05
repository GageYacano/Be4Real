pipeline {
    agent any

    environment {
        NODE_VERSION = '20'
        API_DIR = 'api'
        DEPLOY_DIR = '/opt/api'
        SERVICE_NAME = 'api'
        ENTRY_FILE = 'src/index.js'
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
                npm ci
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
                rm -rf ${DEPLOY_DIR}/* && mkdir -p ${DEPLOY_DIR}
                cp -r ${API_DIR}/dist/* ${DEPLOY_DIR}/
                cp ${API_DIR}/package.json ${DEPLOY_DIR}/
                cp ${API_DIR}/package-lock.json ${DEPLOY_DIR}/
                cp ${API_DIR}/.env ${DEPLOY_DIR}/ || true
                '''
            }
        }

        stage('Install Dependencies and Restart PM2') {
            steps {
                sh '''
                cd ${DEPLOY_DIR}
                npm ci --omit=dev
                if ! command -v pm2 > /dev/null; then
                    npm install -g pm2
                fi
                pm2 reload ${SERVICE_NAME} --update-env || pm2 start ${ENTRY_FILE} --name ${SERVICE_NAME}
                pm2 save
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
