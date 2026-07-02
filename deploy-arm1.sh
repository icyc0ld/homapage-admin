#!/bin/bash
set -e

# 快速连接并部署 homepage-admin v3 到 ARM 服务器
# 密码从同目录 .env.deploy 读取（该文件已加入 .gitignore）

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
export DISPLAY=:0
export SSH_ASKPASS="$SCRIPT_DIR/.deploy-askpass.sh"
export SSH_ASKPASS_REQUIRE=force

source "$SCRIPT_DIR/.env.deploy"

IMAGE="ghcr.io/icyc0ld/homapage-admin:test-v5"
CONTAINER_NAME="hp-admin"
DATA_DIR="/vol2/1000/docker/hp-admin"
PORT="7666"

# Ensure GHCR_PAT is set for private image pull
if [ -z "$GHCR_PAT" ]; then
  echo "ERROR: GHCR_PAT is not set in .env.deploy"
  echo "Please add: GHCR_PAT='ghp_xxxxxxxxxxxxxxxxxxxx'"
  exit 1
fi

echo "==> Deploying $IMAGE to ARM server (arm1)..."

ssh arm1 <<EOF
set -e

IMAGE="$IMAGE"
CONTAINER_NAME="$CONTAINER_NAME"
DATA_DIR="$DATA_DIR"
PORT="$PORT"
DEPLOY_PASSWORD="$DEPLOY_PASSWORD"
GHCR_PAT="$GHCR_PAT"

echo "==> Creating data directory: \$DATA_DIR"
mkdir -p "\$DATA_DIR"

echo "==> Configuring GHCR mirror..."
MIRROR_STATUS=\$(echo "\$DEPLOY_PASSWORD" | sudo -S python3 -c '
import json, os
path = "/etc/docker/daemon.json"
mirror = "https://mh5tjqtuhnnixf-ghcr.xuanyuan.run"
config = {}
if os.path.exists(path):
    try:
        with open(path) as f:
            config = json.load(f)
    except Exception:
        config = {}
mirrors = config.get("registry-mirrors", [])
if mirror not in mirrors:
    mirrors.append(mirror)
    config["registry-mirrors"] = mirrors
    with open(path, "w") as f:
        json.dump(config, f, indent=2)
    print("ADDED")
else:
    print("PRESENT")
')

if [ "\$MIRROR_STATUS" = "ADDED" ]; then
  echo "==> Restarting Docker to apply mirror..."
  echo "\$DEPLOY_PASSWORD" | sudo -S systemctl restart docker 2>/dev/null || echo "\$DEPLOY_PASSWORD" | sudo -S service docker restart
  sleep 5
fi

echo "==> Stopping old container if exists..."
echo "\$DEPLOY_PASSWORD" | sudo -S docker stop "\$CONTAINER_NAME" 2>/dev/null || true
echo "\$DEPLOY_PASSWORD" | sudo -S docker rm "\$CONTAINER_NAME" 2>/dev/null || true

echo "==> Logging in to GHCR..."
echo "\$DEPLOY_PASSWORD" | sudo -S docker login ghcr.io -u icyc0ld -p "\$GHCR_PAT"

echo "==> Pulling image..."
echo "\$DEPLOY_PASSWORD" | sudo -S docker pull "\$IMAGE"

echo "==> Starting container..."
echo "\$DEPLOY_PASSWORD" | sudo -S docker run -d \\
  --name "\$CONTAINER_NAME" \\
  --restart unless-stopped \\
  -p "\${PORT}:8080" \\
  -v "\${DATA_DIR}:/app/backend/data" \\
  -e SYNC_HOST=192.168.100.101 \\
  -e SYNC_PORT=220 \\
  -e SYNC_USER=admin \\
  -e SYNC_PASSWORD="\$DEPLOY_PASSWORD" \\
  -e HOMEPAGE_CONFIG_DIR=/vol2/1000/docker/hp/config \\
  "\$IMAGE"

echo "==> Deployment complete. Container status:"
echo "\$DEPLOY_PASSWORD" | sudo -S docker ps -f name="\$CONTAINER_NAME"
EOF
