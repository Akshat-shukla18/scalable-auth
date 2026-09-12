# Production-Style Scalable Authentication Platform

[![CI](https://github.com/Akshat-shukla18/scalable-auth/actions/workflows/ci.yml/badge.svg)](https://github.com/Akshat-shukla18/scalable-auth/actions/workflows/ci.yml)

An enterprise-grade, horizontally scalable authentication platform built with Node.js, Express, TypeScript, PostgreSQL, Redis, BullMQ, and React.

## CI Status

This project includes a GitHub Actions workflow that validates type-checking, build output, and tests on every push and pull request.

## Key Features
- **Stateless Horizontal Scaling**: Multi-instance API cluster behind Nginx load balancer (`least_conn`).
- **Argon2id Password Security**: PHC-recommended memory-hard hashing with timing-safe comparisons.
- **Asynchronous Email Worker**: BullMQ + Redis queue with exponential backoff retries.
- **Distributed Rate Limiting**: Atomic sliding-window rate limiters per IP / Account / Route backed by Redis.
- **Rotating Refresh Token Sessions**: Single-use rotating refresh tokens stored in secure HttpOnly cookies with automatic reuse detection & family revocation.
- **Real-Time Observability**: Live system metrics telemetry, health probes (`/health`, `/ready`), and Swagger API documentation.
<img width="1376" height="784" alt="Screenshot 2026-08-23 110801" src="https://github.com/user-attachments/assets/da45efce-74d7-48cc-9711-90f1e2c36ecc" />

## Quick Start (Local Development)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```

### 3. Generate Prisma Client
```bash
npm run db:generate
```

### 4. Start Development Servers
```bash
# Start API server and Email Worker
npm run dev:api

# In a separate terminal, start React frontend
npm run dev:web
```

Open [http://localhost:3000](http://localhost:3000) to access the web application, or [http://localhost:4000/api/docs](http://localhost:4000/api/docs) for Swagger UI.

---

## Running with Docker Compose (Multi-Replica Cluster)

To spin up the full production cluster with **3 API replicas**, PostgreSQL, Redis, BullMQ Worker, React Web, and Nginx Load Balancer:

```bash
docker-compose up --build
```
Access the load balanced gateway at [http://localhost:8080](http://localhost:8080).

---

## Running Tests

```bash
# Run all unit and integration tests
npm test

# Run k6 load test benchmarks
npm run load-test
```
