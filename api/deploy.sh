#!/bin/bash
set -e

LOCAL_DIR="$(pwd)"
REMOTE_USER="root"
REMOTE_HOST="167.99.26.82"
REMOTE_DIR="/opt/api"
SERVICE_NAME="api"
ENTRY_FILE="src/index.js"   # change if different

echo "Building project"
npm run build

echo "Clearing remote directory"
ssh ${REMOTE_USER}@${REMOTE_HOST} "rm -rf ${REMOTE_DIR}/* && mkdir -p ${REMOTE_DIR}"

echo "Copying files"
rsync -avz --delete \
  --exclude='test/' \
  "${LOCAL_DIR}/dist/" "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/"

# 2) copy manifest/env files to the same level
rsync -avz \
  package.json package-lock.json .env \
  "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/"

echo "Installing dependencies and restarting PM2 app"
ssh ${REMOTE_USER}@${REMOTE_HOST} "
  cd ${REMOTE_DIR} &&
  npm ci --omit=dev &&
  pm2 reload ${SERVICE_NAME} --update-env || pm2 start ${ENTRY_FILE} --name ${SERVICE_NAME} &&
  pm2 save
"

echo "✅ Deployment complete."
