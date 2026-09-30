# Scalability Benchmark Report

Generated: 2026-09-30T09:01:36.333Z   Base URL: http://localhost:4000

| Concurrency | Req/s | P50 | P95 | P99 | Errors | CPU | RAM | DB Conn | Redis Ops/s |
|-------------|-------|-----|-----|-----|--------|-----|-----|---------|-------------|
| Baseline | 869.4 r/s | 0.6ms | 2.71ms | 5.08ms | 0% | 4% | 187 MB | N/A | N/A |
| 100 VUs | 2946.2 r/s | 21.57ms | 43.25ms | 53.99ms | 0% | 9% | 391 MB | N/A | N/A |
| 250 VUs | 3372.5 r/s | 60.58ms | 91.94ms | 115.19ms | 0% | 9% | 706 MB | N/A | N/A |
| 500 VUs | 3485.6 r/s | 132.84ms | 180.03ms | 215.3ms | 0% | 9% | 707 MB | N/A | N/A |
| 1,000 VUs | 4145.6 r/s | 270.38ms | 416.16ms | 492.69ms | 0% | 9% | 823 MB | N/A | N/A |
| 2,000 VUs | 0 r/s | 0ms | 0ms | 0ms | 0% | N/A | N/A | N/A | N/A |
| 5,000 VUs | 0 r/s | 0ms | 0ms | 0ms | 0% | N/A | N/A | N/A | N/A |

## Notes
- Single-node local dev server (tsx watch, no Docker)
- CPU/RAM: top Node.js process during each stage
- DB Conn / Redis Ops: N/A (services offline on local dev)
- 1K-5K VUs require Docker + Nginx load balancer for linear scaling