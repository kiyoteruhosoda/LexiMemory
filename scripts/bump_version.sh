#!/usr/bin/env bash
set -euo pipefail

VERSION="$(date -u +%Y%m%d-%H%M%S)"
GIT_VERSION="$(git rev-parse HEAD)"
ENV_FILE=".env"
GIT_FILE="app/git_version.txt"

if [ -f "$ENV_FILE" ]; then
  grep -v '^APP_VERSION=' "$ENV_FILE" > "$ENV_FILE.tmp"
else
  : > "$ENV_FILE.tmp"
fi
mv "$ENV_FILE.tmp" "$ENV_FILE"

echo "APP_VERSION=$VERSION" >> "$ENV_FILE"
echo "$GIT_VERSION" > "$GIT_FILE"

echo "APP_VERSION (UTC) set to $VERSION"
echo "GIT_VERSION set to $GIT_VERSION"
