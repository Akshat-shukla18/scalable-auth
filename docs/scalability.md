# Scalability & Performance Guide

## 1. Horizontal Scaling Architecture

The platform scales horizontally by deploying identical, stateless API replicas behind an Nginx reverse proxy load balancer:

```text
                  ┌──────────────────────┐
                  │ Nginx Load Balancer  │
                  └──────────┬───────────┘
                             │ (least_conn)
            ┌────────────────┼────────────────┐
            │                │                │
      ┌─────▼──────┐   ┌─────▼──────┐   ┌─────▼──────┐
      │   API #1   │   │   API #2   │   │   API #3   │
      └─────┬──────┘   └─────┬──────┘   └─────┬──────┘
            │                │                │
            └────────────────┼────────────────┘
                             │
               ┌─────────────┴─────────────┐
               │                           │
         ┌─────▼──────┐              ┌─────▼──────┐
         │   Redis    │              │ PostgreSQL │
         └────────────┘              └────────────┘
```

### Why Stateless API Nodes?
- **Zero Process Affinity**: Any user request can be served by any node.
- **Dynamic Autoscaling**: Nodes can be added or terminated on demand without dropping user sessions.
- **No Node-to-Node Synchronization**: Coordination is offloaded to Redis and PostgreSQL.

## 2. Distributed Rate Limiting via Redis

Rate limits are enforced atomically across all API instances using Redis sliding-window sorted sets (`ZADD`, `ZREMRANGEBYSCORE`, `ZCARD`) wrapped in a single atomic Lua script:
- **No Race Conditions**: Atomic execution inside Redis eliminates concurrency window gaps.
- **Rolling Window Accuracy**: Prevents burst spikes at window boundaries compared to simple fixed-window counters.
- **Configurable Limits**:
  - `POST /register`: 5 req/min per IP
  - `POST /login`: 10 req/min per IP + Account
  - `POST /verify-email`: 5 req/10 min per user
  - `POST /resend-code`: 3 req/10 min per user
  - `POST /refresh`: 30 req/min per IP

## 3. Database Connection Pooling

PostgreSQL connection management is optimized:
- **Prisma Connection Pooling**: Configured connection pool limits per replica (`connection_limit=10`).
- **Index Optimization**: Single-index lookups on `email`, `refreshTokenHash`, and compound index on `[userId, type, usedAt]`.
