# Scalable Auth Platform - Live Benchmark Report

> **Note**: This report contains **ACTUAL measurements** parsed directly from real k6 test runs executed against the system. No numbers in this report are simulated or hardcoded.

- **Generated At**: `2026-09-30T07:32:14.979Z`
- **Target URL**: `http://localhost:4000`
- **Flow Type**: `health_only`
- **OS Platform**: `win32 (x64)`
- **Node.js Version**: `v22.14.0`

---

## 1. Measured Performance Results

| Concurrency Level | Measured Throughput (RPS) | Avg Latency | P50 Latency | P95 Latency | P99 Latency | Error Rate |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| baseline_10 (1 VUs) | 40.27 req/s | 1.08 ms | 0.8 ms | 2.52 ms | 0 ms | 0% |


---

## 2. Detailed Scenario Breakdown


### Scenario: `baseline_10`
- **Total HTTP Requests Executed**: 1008
- **Throughput**: 40.27 req/s
- **Latency Distribution**:
  - Min: `0 ms`
  - Avg: `1.08 ms`
  - P50 (Median): `0.8 ms`
  - P90: `1.9 ms`
  - P95: `2.52 ms`
  - P99: `0 ms`
  - Max: `18.12 ms`
- **Error Rate**: `0%`
- **Checks Passed**: `100%`
- **Rate Limited (429) Count**: `0`
- **Server Errors (5xx) Count**: `0`
- **Raw k6 Summary File**: `summary-baseline_10-2026-09-30T07-31-49-325Z.json`


---

## 3. Reproduction Steps
To reproduce these exact benchmarks:

```bash
# 1. Start the backend services (single node or 3-replica cluster via Docker Compose)
docker-compose up -d

# 2. Run the real k6 benchmark runner
node tests/load/k6-runner.js --target http://localhost:4000 --scenario baseline_10
```
