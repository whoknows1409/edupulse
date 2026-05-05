# EduPulse Setup Steps (End-to-End)

This guide covers the complete setup for Docker, Jenkins, SonarQube, Prometheus, Grafana, Kubernetes, and AWS EC2.

## 0) Prerequisites

- GitHub repository URL
- AWS account (for EC2 hosting)
- Local machine with SSH client

## 1) AWS EC2 (Recommended for stable webhooks)

### 1.1 Create EC2 instance

- OS: Ubuntu 22.04
- Size: t3.medium or larger (SonarQube needs memory)
- Storage: 20GB+ recommended

### 1.2 Security group inbound rules

- 22 (SSH)
- 3000 (App)
- 8080 (Jenkins)
- 9000 (SonarQube)
- 9090 (Prometheus)
- 3001 (Grafana)

### 1.3 Connect

```bash
ssh -i /path/to/key.pem ubuntu@EC2_PUBLIC_IP
```

## 2) Install Docker and Compose on EC2

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo $VERSION_CODENAME) stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker $USER
newgrp docker
```

## 3) Clone the repo

```bash
git clone <YOUR_REPO_URL>
cd edupulse
```

## 4) Configure environment

```bash
cp .env.example .env
```

Update `NEXTAUTH_URL` to your EC2 public URL, for example:

```
NEXTAUTH_URL="http://EC2_PUBLIC_IP:3000"
```

## 5) SonarQube system requirement (EC2 Linux)

SonarQube needs higher `vm.max_map_count`.

```bash
sudo sysctl -w vm.max_map_count=262144
```

To persist after reboot:

```bash
echo "vm.max_map_count=262144" | sudo tee -a /etc/sysctl.conf
```

## 6) Start the full Docker stack

```bash
docker compose up --build -d
```

Services included:
- App + Postgres
- Jenkins
- SonarQube + Postgres
- Prometheus
- Grafana

## 7) Run database migrations and seed data

```bash
docker compose exec app npx prisma migrate dev
docker compose exec app npm run db:seed
```

## 8) Jenkins setup

### 8.1 Get initial admin password

```bash
docker compose exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```

### 8.2 Complete Jenkins setup

- Open: `http://EC2_PUBLIC_IP:8080`
- Install suggested plugins
- Ensure these plugins are present:
  - Pipeline
  - Git
  - GitHub
  - Credentials Binding

## 9) SonarQube setup

- Open: `http://EC2_PUBLIC_IP:9000`
- Login: `admin / admin` and change password
- Create project with key: `edupulse`
- Generate a token for CI

## 10) Jenkins credentials

### 10.1 SonarQube token

- Jenkins → Manage Jenkins → Credentials → Global → Add Credentials
- Type: Secret text
- ID: `sonarqube-token`
- Value: SonarQube token

### 10.2 GitHub access (private repo only)

- Use a GitHub PAT with `repo` scope
- Add as Jenkins credential (Username/Password)

## 11) Jenkins Pipeline job

- Create a new Pipeline job
- SCM: Git (your GitHub repo)
- Script path: `Jenkinsfile`
- Save and run once manually to verify

## 12) GitHub webhook (EC2)

### 12.1 Jenkins job trigger

- Job → Configure → Build Triggers
- Check: **GitHub hook trigger for GITScm polling**

### 12.2 GitHub repository webhook

- GitHub repo → Settings → Webhooks → Add webhook
- Payload URL: `http://EC2_PUBLIC_IP:8080/github-webhook/`
- Content type: `application/json`
- Secret: optional (recommended)
- Events: Push (add PR events if needed)

## 13) Prometheus + Grafana

- Prometheus: `http://EC2_PUBLIC_IP:9090`
- Grafana: `http://EC2_PUBLIC_IP:3001` (admin / admin)
- Prometheus should show `edupulse` target UP at `/api/metrics`

## 14) App access

- App: `http://EC2_PUBLIC_IP:3000`

## 15) Optional: Kubernetes deployment (separate cluster)

If you have a Kubernetes cluster, use the manifests in `k8s/`.

```bash
cp k8s/secret.example.yaml k8s/secret.yaml
# edit k8s/secret.yaml values

kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/postgres-pvc.yaml
kubectl apply -f k8s/postgres-deployment.yaml
kubectl apply -f k8s/postgres-service.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml

kubectl -n edupulse delete job edupulse-migrate --ignore-not-found
kubectl apply -f k8s/migrate-job.yaml
kubectl -n edupulse wait --for=condition=complete job/edupulse-migrate --timeout=300s
kubectl -n edupulse logs job/edupulse-migrate

kubectl -n edupulse port-forward svc/edupulse 3000:80
```

## Troubleshooting

- Jenkins logs: `docker compose logs -f jenkins`
- SonarQube logs: `docker compose logs -f sonarqube`
- App logs: `docker compose logs -f app`
- Prometheus logs: `docker compose logs -f prometheus`
- Grafana logs: `docker compose logs -f grafana`
