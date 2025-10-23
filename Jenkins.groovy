pipeline {
    agent any

    environment {
        NODE_VERSION = '20'
        API_DIR = 'api'
        DEPLOY_DIR = '/opt/be4real-api'
        PM2_NAME = 'be4real-api'
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
                npm install
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
                sudo mkdir -p ${DEPLOY_DIR}
                sudo cp -r ${API_DIR}/* ${DEPLOY_DIR}/
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
                        pm2 start dist/src/server.js --name ${PM2_NAME}
                    fi

                    pm2 save

                    sudo env PATH=$PATH:/usr/bin:/usr/local/bin pm2 startup systemd -u jenkins --hp /var/lib/jenkins -u jenkins --hp /var/lib/jenkins
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
