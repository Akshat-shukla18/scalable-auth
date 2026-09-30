# Scalability Benchmark Report

Generated: 2026-09-30T09:05:21.987Z   Base URL: http://localhost:4000

| Concurrency | Req/s | P50 | P95 | P99 | Errors | CPU | RAM | DB Conn | Redis Ops/s |
|-------------|-------|-----|-----|-----|--------|-----|-----|---------|-------------|
| Baseline | 874.8 r/s | 0.59ms | 2.47ms | 4.74ms | 0% | 4% | 265 MB | N/A | N/A |
| 100 VUs | 3362.9 r/s | 16.84ms | 37.19ms | 56.09ms | 0% | 10% | 675 MB | N/A | N/A |
| 250 VUs | 3401.7 r/s | 58.46ms | 98.11ms | 135.46ms | 0% | 9% | 921 MB | N/A | N/A |
| 500 VUs | 3384.4 r/s | 128.35ms | 227.16ms | 337.25ms | 0% | 9% | 1009 MB | N/A | N/A |
| 1,000 VUs | 5015.6 r/s | 247.14ms | 416.58ms | 662.41ms | 0% | 9% | 1.2 GB | N/A | N/A |
| 2,000 VUs | 11005.6 r/s | 0ms | 894.72ms | 1248.52ms | 0% | 8% | 1.1 GB | N/A | N/A |
| 5,000 VUs | 8521.3 r/s | 0ms | 0ms | 3911.62ms | 0% | 1% | 308 MB | N/A | N/A |

## Notes
- Single-node local dev server (tsx watch, no Docker)
- CPU/RAM: top Node.js process during each stage
- DB Conn / Redis Ops: N/A (services offline on local dev)
- 2K-5K VUs require Docker + Nginx load balancer for linear scaling