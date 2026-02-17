#!/usr/bin/env bash
set -e

VERSION=$(date +%Y%m%d-%H%M%S)
GIT_VERSION=$(git rev-parse HEAD)
ENV_FILE=".env"
GIT_FILE="app/git_version.txt"

# 既存の APP_VERSION を削除
grep -v "^APP_VERSION=" "$ENV_FILE" > "$ENV_FILE.tmp" || true
mv "$ENV_FILE.tmp" "$ENV_FILE"
# 末尾に追加
echo "APP_VERSION=$VERSION" >> "$ENV_FILE"

# Git version をファイルに書き込み
echo "$GIT_VERSION" > "$GIT_FILE"

echo "APP_VERSION set to $VERSION"
echo "GIT_VERSION set to $GIT_VERSION"
