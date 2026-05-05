# EduPulse

EduPulse is a student results, attendance, and analytics portal designed for academic demonstration. The system combines a modern Next.js application, a Prisma-managed PostgreSQL data layer, and role-based authentication.

## Project Scope

EduPulse supports two primary user roles (Admin, Student) and provides:

- Role-based authentication and access control
- Student dashboards with GPA, results, and attendance summaries
- Administrative dashboards for cohort analytics and low-attendance watchlists
- Attendance and results management workflows
- Excel-based attendance import for batch updates
- Analytics charts (performance, attendance distribution, correlation)

## Technology Stack

- Next.js (App Router), React, TypeScript
- Prisma ORM with PostgreSQL
- NextAuth (credentials-based authentication)
- Tailwind CSS

## Local Development Setup

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables:

```bash
cp .env.example .env
```

3. Ensure PostgreSQL is running locally and update `DATABASE_URL` in `.env`.

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

## Docker Compose (App + DB)

```bash
docker compose up --build
```

Run migrations and seed data in the app container:

```bash
docker compose exec app npx prisma migrate dev
docker compose exec app npm run db:seed
```

Open http://localhost:3000.

## Jenkins + SonarQube (Local)

Start the stack (includes Jenkins and SonarQube):

```bash
docker compose up --build
```

Jenkins setup:

```bash
docker compose exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```

Open http://localhost:8080 and complete the setup wizard.

SonarQube setup:

1. Open http://localhost:9000 (default login: admin / admin).
2. Change the admin password when prompted.
3. Create a project with key `edupulse` and generate a token.

Jenkins pipeline:

1. Create a Jenkins credential (Secret text) named `sonarqube-token` with the Sonar token.
2. Create a Pipeline job that points to this repo and uses the `Jenkinsfile`.
3. Run the pipeline.

## Prometheus + Grafana (Local)

Start the stack:

```bash
docker compose up --build
```

Access:

- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001 (admin / admin)

## Kubernetes (Cluster)

1. Create a copy of the secrets file and update values:

```bash
cp k8s/secret.example.yaml k8s/secret.yaml
```

2. Apply manifests:

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

3. Run migrations:

```bash
kubectl -n edupulse delete job edupulse-migrate --ignore-not-found
kubectl apply -f k8s/migrate-job.yaml
kubectl -n edupulse wait --for=condition=complete job/edupulse-migrate --timeout=300s
kubectl -n edupulse logs job/edupulse-migrate
```

4. Access the service:

```bash
kubectl -n edupulse port-forward svc/edupulse 3000:80
```

## AWS (EC2)

See the EC2 deployment guide: [infra/aws/README-ec2.md](infra/aws/README-ec2.md)

## Demo Accounts

- Admin: admin@edupulse.dev / Admin@123
- Student: aarav@edupulse.dev / Student@123


## Helpful Commands

```bash
npm run lint
npm run test
npm run typecheck
npm run prisma:studio
```
