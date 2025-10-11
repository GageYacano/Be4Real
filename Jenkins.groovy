    agent any

    environment {
        NODE_VERSION = '20'
        SERVER_DIR = 'svr'
        CLIENT_DIR = 'client'
        BUILD_DIR = 'client/build'
        DEPLOY_DIR = '/opt'
        PM2_NAME = 'mern-app'
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
                cd ${SERVER_DIR} && npm install
                cd ../${CLIENT_DIR} && npm install
                '''
            }
        }

        stage('Build Frontend') {
            steps {
                sh '''
                cd ${CLIENT_DIR}
                npm run build
                '''
            }
        }

        stage('Deploy to Server') {
            steps {
                sh '''
                echo "Deploying build and backend to ${DEPLOY_DIR}..."
                sudo mkdir -p ${DEPLOY_DIR}
                sudo cp -r ${SERVER_DIR}/* ${DEPLOY_DIR}/
                sudo cp -r ${BUILD_DIR} ${DEPLOY_DIR}/public
                '''
            }
        }

        stage('Install PM2 and Restart App') {
            steps {
                sh '''
                if ! command -v pm2 > /dev/null; then
                    sudo npm install -g pm2
                fi

                cd ${DEPLOY_DIR}
                if pm2 list | grep -q ${PM2_NAME}; then
                    pm2 restart ${PM2_NAME}
                else
                    pm2 start server.js --name ${PM2_NAME}
                fi

                pm2 save
                pm2 startup systemd -u jenkins --hp /var/lib/jenkins
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
