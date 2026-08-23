# System Architecture

The **Scalable Authentication Platform** is designed as a production-grade, horizontally scalable modular monolith. It provides enterprise-class security, sub-50ms API responses, and resilient asynchronous processing.

## 1. High-Level Architecture Diagram

```mermaid
graph TD
    Client[React + TypeScript SPA] -->|HTTPS Requests| LB[Nginx Load Balancer]
    
    subgraph Stateless API Cluster
        LB -->|Least Connections| API1[API Replica #1]
        LB -->|Least Connections| API2[API Replica #2]
        LB -->|Least Connections| API3[API Replica #3]
    end
    
    subgraph Distributed Data & Coordination Layer
        API1 --> Redis[(Redis Cache & Rate Limiting)]
        API2 --> Redis
        API3 --> Redis
        API1 --> Postgres[(PostgreSQL Primary DB)]
        API2 --> Postgres
        API3 --> Postgres
    end
    
    subgraph Asynchronous Worker Pipeline
        Redis -->|BullMQ Jobs| Queue[(Email Queue)]
        Queue --> Worker[Email Worker Node]
        Worker --> Provider[Email Provider Adapter]
    end
```

## 2. Core Architectural Decisions

### Modular Monolith vs. Microservices
We intentionally structure the backend as a modular monolith (`Routes -> Controllers -> Services -> Repositories -> Database`) rather than prematurely introducing microservices:
1. **Zero RPC Overhead**: In-process method calls between auth, sessions, and system modules execute in microseconds.
2. **Simplified Transactions**: Cross-table atomic guarantees in PostgreSQL without requiring two-phase commits or saga orchestrators.
3. **Independent Worker Process**: The email queue consumer is decoupled into a dedicated worker process, preventing CPU-intensive or network-bound email operations from blocking HTTP request event loops.

### Stateless API Instances
Every API replica (`API #1`, `API #2`, `API #3`) is completely stateless:
- **No in-memory session stores**: Sessions are persisted in PostgreSQL; refresh tokens are hashed with SHA-256.
- **No in-memory rate limiters**: Rate limiting state is tracked across all nodes atomically using Redis sliding-window Lua scripts.
- **Any request can hit any node**: Load balancers use `least_conn` or round-robin without requiring sticky sessions.
