#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   ./scripts/promote_same_image.sh <api_image> <web_image> <from_tag> <to_tag>
# Example:
#   ./scripts/promote_same_image.sh ghcr.io/acme/linguisticnode-api ghcr.io/acme/linguisticnode-web stg-20260227 prod-20260227

API_IMAGE="${1:-}"
WEB_IMAGE="${2:-}"
FROM_TAG="${3:-}"
TO_TAG="${4:-}"

if [ -z "$API_IMAGE" ] || [ -z "$WEB_IMAGE" ] || [ -z "$FROM_TAG" ] || [ -z "$TO_TAG" ]; then
  echo "[ERROR] arguments are required: <api_image> <web_image> <from_tag> <to_tag>"
  exit 1
fi

echo "[INFO] Pulling source tags"
docker pull "${API_IMAGE}:${FROM_TAG}"
docker pull "${WEB_IMAGE}:${FROM_TAG}"

echo "[INFO] Promoting tags (same-image promotion)"
docker tag "${API_IMAGE}:${FROM_TAG}" "${API_IMAGE}:${TO_TAG}"
docker tag "${WEB_IMAGE}:${FROM_TAG}" "${WEB_IMAGE}:${TO_TAG}"

echo "[INFO] Pushing promoted tags"
docker push "${API_IMAGE}:${TO_TAG}"
docker push "${WEB_IMAGE}:${TO_TAG}"

echo "[INFO] Promotion completed"
