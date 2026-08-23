# Architectural Decision Records (ADRs)

## ADR-001: Selection of PostgreSQL over MongoDB
- **Context**: Authentication systems require strict ACID guarantees for user creation, unique email constraints, and foreign key cascades on session revocation.
- **Decision**: Use PostgreSQL with Prisma ORM.
- **Consequences**: Provides atomic multi-record integrity, strict schema validation, and optimized B-tree indexes.

## ADR-002: Modular Monolith vs. Microservices
- **Context**: Avoid distributed system complexity and network RPC latency while maintaining clean separation of concerns.
- **Decision**: Structure as a modular monolith with decoupled routes, controllers, services, repositories, and an independent background worker process.
- **Consequences**: Zero RPC overhead, simplified testing, and straightforward extraction of individual modules if necessary in future iterations.

## ADR-003: Redis for Rate Limiting & BullMQ Queues
- **Context**: State across multi-instance API nodes must be shared without storing state in Node.js process memory.
- **Decision**: Use Redis for distributed sliding-window rate limiting and BullMQ for reliable email queues.
- **Consequences**: Sub-millisecond atomic rate limiting and zero lost email jobs during traffic spikes.

## ADR-004: Refresh Token Rotation & Reuse Detection
- **Context**: Long-lived sessions must remain secure against token theft.
- **Decision**: Issue single-use refresh tokens stored in HttpOnly cookies that rotate on every `/refresh` request. If an old token is reused, revoke the entire user session family.
- **Consequences**: Stolen refresh tokens are immediately rendered useless upon normal user activity.
