# Scalability Benchmark Report

Generated: 2026-09-30T08:52:06.046Z   Base URL: http://localhost:4000

| Concurrency | Req/s | P50 | P95 | P99 | Errors | CPU | RAM | DB Conn | Redis Ops/s |
|-------------|-------|-----|-----|-----|--------|-----|-----|---------|-------------|
| Baseline | 855.4 r/s | 0.82ms | 2.98ms | 4.6ms | 0% | 5% | 160 MB | N/A | N/A |
| 100 VUs | 3125.8 r/s | 18.39ms | 48.01ms | 71.76ms | 0% | 9% | 393 MB | N/A | N/A |
| 250 VUs | 3281.7 r/s | 62.49ms | 96.82ms | 124.41ms | 0% | 9% | 480 MB | N/A | N/A |
| 500 VUs | 3312.2 r/s | 142.25ms | 193.71ms | 233.92ms | 0% | 9% | 563 MB | N/A | N/A |
| 1,000 VUs | 0 r/s | 0ms | 0ms | 0ms | 0% | N/A | N/A | N/A | N/A |
| 2,000 VUs | 0 r/s | 0ms | 0ms | 0ms | 0% | N/A | N/A | N/A | N/A |
| 5,000 VUs | 0 r/s | 0ms | 0ms | 0ms | 0% | N/A | N/A | N/A | N/A |

## Notes
- Single-node local dev server (no Docker/Redis/Postgres)
- CPU/RAM: top Node.js process during each stage
- DB Conn / Redis Ops: N/A (services offline on local dev)