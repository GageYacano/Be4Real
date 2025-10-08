#!/bin/bash
set -e

LOCAL_DIR="$(pwd)"
REMOTE_USER="root"
REMOTE_HOST="167.99.26.82"
REMOTE_DIR="/opt/svr"
SERVICE_NAME="svr"

echo "Building project"
npm run build

echo "Clearing remote directory"
ssh ${REMOTE_USER}@${REMOTE_HOST} "sudo rm -rf ${REMOTE_DIR}/*"

echo "Copying files"
rsync -avz \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude 'src' \
  --exclude 'deploy.sh'
  ${LOCAL_DIR}/ ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/

echo "Installing dependencies and restarting server"
ssh ${REMOTE_USER}@${REMOTE_HOST} "
  cd ${REMOTE_DIR} &&
  npm ci --omit=dev
  sudo systemctl daemon-reload &&
  sudo systemctl restart ${SERVICE_NAME} &&
  sudo systemctl status ${SERVICE_NAME} --no-pager -l | head -n 10
"

echo "✅ Deployment complete."
