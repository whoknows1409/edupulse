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

START_JENKINS=${START_JENKINS:-true}
START_MONITORING=${START_MONITORING:-true}
RESET_CLUSTER=${RESET_CLUSTER:-true}

cd "$ROOT_DIR"

if docker compose version >/dev/null 2>&1; then
  echo "Stopping monitoring stack (Compose)..."
  docker compose down || true
fi

if docker ps -a --format '{{.Names}}' | grep -xq jenkins; then
  echo "Stopping Jenkins container..."
  docker stop jenkins >/dev/null || true
fi

if [[ "$RESET_CLUSTER" == "true" ]]; then
  echo "Deleting Minikube cluster (data reset)..."
  minikube delete || true
fi

echo "Starting Minikube..."
minikube start --driver=docker --wait=all

if ! kubectl get storageclass >/dev/null 2>&1; then
  echo "Enabling storage addons..."
  minikube addons enable storage-provisioner || true
  minikube addons enable default-storageclass || true
fi

if ! kubectl get storageclass >/dev/null 2>&1; then
  echo "Retrying storage addons with validation disabled..."
  minikube ssh -- "sudo kubectl --kubeconfig=/var/lib/minikube/kubeconfig apply --validate=false -f /etc/kubernetes/addons/storage-provisioner.yaml" || true
  minikube ssh -- "sudo kubectl --kubeconfig=/var/lib/minikube/kubeconfig apply --validate=false -f /etc/kubernetes/addons/storageclass.yaml" || true
fi

if [[ ! -f "$ROOT_DIR/k8s/secret.yaml" ]]; then
  echo "Missing k8s/secret.yaml. Create it from the README sample before continuing."
  exit 1
fi

echo "Building app images..."
docker build -t edupulse:local -t edupulse:migrate .

minikube image load edupulse:local
minikube image load edupulse:migrate

echo "Applying Kubernetes manifests..."
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/postgres-pvc.yaml
kubectl apply -f k8s/postgres-deployment.yaml
kubectl apply -f k8s/postgres-service.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml

echo "Waiting for Postgres to be ready..."
kubectl -n edupulse rollout status deployment/edupulse-postgres --timeout=180s

kubectl -n edupulse set image deployment/edupulse edupulse=edupulse:local
kubectl -n edupulse rollout status deployment/edupulse

kubectl -n edupulse delete job edupulse-migrate --ignore-not-found
kubectl -n edupulse apply -f k8s/migrate-job.yaml
kubectl -n edupulse wait --for=condition=complete job/edupulse-migrate --timeout=300s
kubectl -n edupulse logs job/edupulse-migrate

MIGRATE_SUCCEEDED=$(kubectl -n edupulse get job edupulse-migrate -o jsonpath='{.status.succeeded}')
if [[ "$MIGRATE_SUCCEEDED" != "1" ]]; then
  echo "Migration job did not complete successfully."
  exit 1
fi

kubectl -n edupulse exec deploy/edupulse -- npx tsx prisma/seed.ts

if [[ "$START_JENKINS" == "true" ]]; then
  if docker ps -a --format '{{.Names}}' | grep -xq jenkins; then
    docker start jenkins >/dev/null
  else
    docker run -d --name jenkins \
      -p 8080:8080 -p 50000:50000 \
      -v jenkins_home:/var/jenkins_home \
      jenkins/jenkins:lts
  fi
  echo "Jenkins: http://localhost:8080"
fi

if [[ "$START_MONITORING" == "true" ]]; then
  if docker compose version >/dev/null 2>&1; then
    docker compose up -d --build
    echo "Prometheus: http://localhost:9090"
    echo "Grafana: http://localhost:3001"
  fi
fi

echo "Cluster status:"
kubectl -n edupulse get pods

echo "To open the app:"
echo "  kubectl -n edupulse port-forward svc/edupulse 3000:80"
