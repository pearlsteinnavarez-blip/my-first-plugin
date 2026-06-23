#!/bin/bash
set -euo pipefail

VAULT_PLUGIN_DIR="/Users/huguomin/Library/Mobile Documents/iCloud~md~obsidian/Documents/知识体系/.obsidian/plugins/my-first-plugin"
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

cd "$PROJECT_DIR"
npm run build
cp main.js manifest.json styles.css "$VAULT_PLUGIN_DIR/"

echo "Deployed to: $VAULT_PLUGIN_DIR"
echo "Version: $(grep '"version"' manifest.json)"
ls -la "$VAULT_PLUGIN_DIR"
