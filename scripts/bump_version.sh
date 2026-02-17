#!/usr/bin/env bash
set -e

VERSION=$(date +%Y%m%d-%H%M%S)

ENV_FILE=".env"

# 既存の APP_VERSION を削除
grep -v "^APP_VERSION=" "$ENV_FILE" > "$ENV_FILE.tmp" || true
mv "$ENV_FILE.tmp" "$ENV_FILE"

# 末尾に追加
echo "APP_VERSION=$VERSION" >> "$ENV_FILE"

echo "APP_VERSION set to $VERSION"
