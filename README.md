# EduPulse

EduPulse is a student results, attendance, and analytics portal designed for academic demonstration and DevOps evaluation. The system combines a modern Next.js application, a Prisma-managed PostgreSQL data layer, role-based authentication, and production-style operational tooling (Docker, Jenkins, Prometheus, Grafana).

## Project Scope

EduPulse supports two primary user roles (Admin, Student) and provides:

- Role-based authentication and access control
- Student dashboards with GPA, results, and attendance summaries
- Administrative dashboards for cohort analytics and low-attendance watchlists
- Attendance and results management workflows
- Analytics charts (performance, attendance distribution, correlation)
- Containerized services and CI/CD pipeline automation

## Technology Stack

- Next.js (App Router), React, TypeScript
- Prisma ORM with PostgreSQL
- NextAuth (credentials-based authentication)
- Tailwind CSS
- Prometheus + Grafana for metrics and dashboards
- Jenkins for CI/CD orchestration

## Local Development Setup

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables:

```bash
cp .env.example .env
```

3. Start PostgreSQL:

```bash
docker compose up -d db
```

The default host port is 5433 to avoid conflicts with local Postgres.

4. Apply migrations and seed demo data:

```bash
npx prisma migrate dev
npm run db:seed
```

5. Run the application:

```bash
npm run dev
```

Note: `npm run dev` uses Webpack by default to avoid workspace-level module resolution issues.

Open http://localhost:3000.

## Demo Accounts

- Admin: admin@edupulse.dev / Admin@123
- Student: aarav@edupulse.dev / Student@123

## Docker Compose (App + DB + Monitoring)

```bash
docker compose up --build
```

- App: http://localhost:3000
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001 (admin/admin)

## CI/CD (Jenkins)

The Jenkins pipeline defined in [Jenkinsfile](Jenkinsfile) performs install, lint, test, build, and deploy steps. Deployment is Kubernetes-based, and migrations are executed as a cluster Job to avoid multi-pod race conditions.

Required Jenkins environment variables:

- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`

## Monitoring

Prometheus scrapes `/api/metrics` from the application service. Grafana is pre-provisioned with a starter dashboard in [monitoring/grafana/dashboards/edupulse.json](monitoring/grafana/dashboards/edupulse.json).

## Kubernetes Secret (Local Only)

The live Kubernetes secret file is kept out of version control. Create it locally at [k8s/secret.yaml](k8s/secret.yaml) using the following example and replace all placeholder values:

```yaml
apiVersion: v1
kind: Secret
metadata:
	name: edupulse-secrets
	namespace: edupulse
type: Opaque
stringData:
	DATABASE_URL: "postgresql://USER:PASSWORD@edupulse-postgres:5432/edupulse?schema=public"
	NEXTAUTH_SECRET: "REPLACE_WITH_STRONG_RANDOM"
	POSTGRES_USER: "edupulse"
	POSTGRES_PASSWORD: "REPLACE_WITH_STRONG_PASSWORD"
	POSTGRES_DB: "edupulse"
```

## Demo Checklist (Minikube)

1. Start Minikube:

```bash
minikube start --driver=docker
```

2. Apply Kubernetes manifests:

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/postgres-pvc.yaml
kubectl apply -f k8s/postgres-deployment.yaml
kubectl apply -f k8s/postgres-service.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
```

3. Build and load the app image:

```bash
docker build -t edupulse:local .
minikube image load edupulse:local
kubectl -n edupulse set image deployment/edupulse edupulse=edupulse:local
kubectl -n edupulse rollout status deployment/edupulse
```

4. Run Prisma migrations inside the cluster:

```bash
docker build -t edupulse:migrate .
minikube image load edupulse:migrate
kubectl -n edupulse delete job edupulse-migrate --ignore-not-found
kubectl -n edupulse apply -f k8s/migrate-job.yaml
kubectl -n edupulse wait --for=condition=complete job/edupulse-migrate --timeout=300s
kubectl -n edupulse logs job/edupulse-migrate
```

5. Port-forward the application:

```bash
kubectl -n edupulse port-forward svc/edupulse 3000:80
```

Open http://localhost:3000.

## Demo Start/Stop Scripts

Start everything (Minikube, Jenkins, monitoring):

```bash
./scripts/demo-start.sh
```

Stop everything safely (state preserved):

```bash
./scripts/demo-stop.sh
```

## Helpful Commands

```bash
npm run lint
npm run test
npm run typecheck
npm run prisma:studio
```
