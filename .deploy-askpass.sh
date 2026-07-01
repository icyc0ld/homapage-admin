#!/bin/bash
# SSH_ASKPASS helper: reads password from .env.deploy
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/.env.deploy" 2>/dev/null
printf '%s\n' "$DEPLOY_PASSWORD"
