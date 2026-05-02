#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if command -v docker >/dev/null 2>&1; then
  if docker info >/dev/null 2>&1; then
    cd "$ROOT_DIR"
    if docker compose version >/dev/null 2>&1; then
      echo "Stopping monitoring stack (Compose)..."
      docker compose down
    else
      echo "docker compose not available. Skipping monitoring stop."
    fi

    if docker ps -a --format '{{.Names}}' | grep -xq jenkins; then
      echo "Stopping Jenkins container..."
      docker stop jenkins >/dev/null
    else
      echo "Jenkins container not found. Skipping."
    fi
  else
    echo "Docker daemon is not running. Skipping Docker stop steps."
  fi
else
  echo "Docker not installed. Skipping Docker stop steps."
fi

if command -v minikube >/dev/null 2>&1; then
  echo "Stopping Minikube (state preserved)..."
  minikube stop
else
  echo "Minikube not installed. Skipping."
fi

echo "If you have a port-forward running, stop it with Ctrl+C in that terminal."
