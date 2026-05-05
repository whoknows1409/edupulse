# AWS EC2 Deployment (Docker Compose)

This guide deploys EduPulse on a single EC2 instance with Docker Compose.

## Prerequisites

- AWS account
- EC2 instance (Ubuntu 22.04 recommended)
- Security Group:
  - TCP 22 (SSH)
  - TCP 3000 (app)
  - TCP 8080 (Jenkins)
  - TCP 9000 (SonarQube)
  - TCP 9090 (Prometheus)
  - TCP 3001 (Grafana)

## 1. Connect to EC2

```bash
ssh -i /path/to/key.pem ubuntu@EC2_PUBLIC_IP
```

## 2. Install Docker and Compose

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

## 3. Clone the repo

```bash
git clone <YOUR_REPO_URL>
cd edupulse
```

## 4. Configure environment

Copy the example env and update values:

```bash
cp .env.example .env
```

Update `NEXTAUTH_URL` to your EC2 public URL (for example `http://EC2_PUBLIC_IP:3000`).

## 5. Start the stack

```bash
docker compose up --build -d
```

## 6. Run migrations and seed data

```bash
docker compose exec app npx prisma migrate dev
docker compose exec app npm run db:seed
```

## 7. Access services

- App: http://EC2_PUBLIC_IP:3000
- Jenkins: http://EC2_PUBLIC_IP:8080
- SonarQube: http://EC2_PUBLIC_IP:9000
- Prometheus: http://EC2_PUBLIC_IP:9090
- Grafana: http://EC2_PUBLIC_IP:3001

## Notes

- For production, restrict security group ports and use a reverse proxy (Nginx) + HTTPS.
- For SonarQube stability, consider increasing instance size (t3.medium or larger).
