#!/bin/bash
set -e

# 快速连接并部署 homepage-admin v2 到 ARM 服务器
# 密码从同目录 .env.deploy 读取（该文件已加入 .gitignore）

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
export DISPLAY=:0
export SSH_ASKPASS="$SCRIPT_DIR/.deploy-askpass.sh"
export SSH_ASKPASS_REQUIRE=force

source "$SCRIPT_DIR/.env.deploy"

IMAGE="ghcr.io/icyc0ld/homapage-admin:test-v2"
CONTAINER_NAME="hp-admin"
DATA_DIR="/vol2/1000/docker/hp-admin"
PORT="6666"

echo "==> Deploying $IMAGE to ARM server (arm1)..."

ssh arm1 <<EOF
set -e

IMAGE="$IMAGE"
CONTAINER_NAME="$CONTAINER_NAME"
DATA_DIR="$DATA_DIR"
PORT="$PORT"
DEPLOY_PASSWORD="$DEPLOY_PASSWORD"

echo "==> Creating data directory: \$DATA_DIR"
mkdir -p "\$DATA_DIR"

echo "==> Stopping old container if exists..."
echo "\$DEPLOY_PASSWORD" | sudo -S docker stop "\$CONTAINER_NAME" 2>/dev/null || true
echo "\$DEPLOY_PASSWORD" | sudo -S docker rm "\$CONTAINER_NAME" 2>/dev/null || true

echo "==> Pulling image..."
echo "\$DEPLOY_PASSWORD" | sudo -S docker pull "\$IMAGE"

echo "==> Starting container..."
echo "\$DEPLOY_PASSWORD" | sudo -S docker run -d \\
  --name "\$CONTAINER_NAME" \\
  --restart unless-stopped \\
  -p "\${PORT}:8080" \\
  -v "\${DATA_DIR}:/app/backend/data" \\
  "\$IMAGE"

echo "==> Deployment complete. Container status:"
echo "\$DEPLOY_PASSWORD" | sudo -S docker ps -f name="\$CONTAINER_NAME"
EOF
