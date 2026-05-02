#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1"
    exit 1
  fi
}

require_cmd docker
require_cmd minikube
require_cmd kubectl

if ! docker info >/dev/null 2>&1; then
  echo "Docker daemon is not running. Start Docker and try again."
  exit 1
fi

echo "Starting Minikube..."
minikube start --driver=docker

if docker ps -a --format '{{.Names}}' | grep -xq jenkins; then
  echo "Starting Jenkins container..."
  docker start jenkins >/dev/null
  echo "Jenkins: http://localhost:8080"
else
  echo "Jenkins container not found. Skipping."
fi

cd "$ROOT_DIR"
if docker compose version >/dev/null 2>&1; then
  echo "Starting monitoring stack (Prometheus + Grafana)..."
  docker compose up -d --build
  echo "Prometheus: http://localhost:9090"
  echo "Grafana: http://localhost:3001"
else
  echo "docker compose not available. Skipping monitoring."
fi

if kubectl get namespace edupulse >/dev/null 2>&1; then
  echo "Cluster status:"
  kubectl -n edupulse get pods
else
  echo "Namespace 'edupulse' not found. Apply manifests before demo."
fi

echo "To open the app:"
echo "  kubectl -n edupulse port-forward svc/edupulse 3000:80"
